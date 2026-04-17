-- =========================
-- Catálogo de produtos pagos (suporta múltiplas variações por gateway)
-- =========================
CREATE TABLE public.produtos_pagamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway text NOT NULL CHECK (gateway IN ('hotmart','kiwify','greenn','stripe','manual','cortesia')),
  produto_externo_id text NOT NULL,
  oferta_externa_id text,
  nome text NOT NULL,
  descricao text,
  creditos_concedidos integer NOT NULL DEFAULT 1 CHECK (creditos_concedidos > 0),
  preco_centavos integer,
  moeda text DEFAULT 'BRL',
  checkout_url text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gateway, produto_externo_id, oferta_externa_id)
);

CREATE INDEX idx_produtos_pagamento_gateway ON public.produtos_pagamento(gateway, ativo);

ALTER TABLE public.produtos_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read produtos ativos"
ON public.produtos_pagamento FOR SELECT
TO authenticated
USING (ativo = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage produtos"
ON public.produtos_pagamento FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_produtos_pagamento_updated_at
BEFORE UPDATE ON public.produtos_pagamento
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- Créditos de diagnóstico
-- =========================
CREATE TABLE public.creditos_diagnostico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  origem text NOT NULL CHECK (origem IN ('cortesia','hotmart','kiwify','greenn','stripe','manual')),
  produto_id uuid REFERENCES public.produtos_pagamento(id),
  transacao_externa_id text,
  email_comprador text,
  metadata jsonb DEFAULT '{}'::jsonb,
  diagnostico_id uuid,
  consumido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_creditos_user_disponivel ON public.creditos_diagnostico(user_id) WHERE diagnostico_id IS NULL;
CREATE INDEX idx_creditos_transacao ON public.creditos_diagnostico(origem, transacao_externa_id);
CREATE UNIQUE INDEX idx_creditos_dedup_transacao ON public.creditos_diagnostico(origem, transacao_externa_id) 
  WHERE transacao_externa_id IS NOT NULL;

ALTER TABLE public.creditos_diagnostico ENABLE ROW LEVEL SECURITY;

-- Usuários veem apenas seus créditos (sem distinguir cortesia visualmente — frontend mostra só "créditos disponíveis")
CREATE POLICY "Users read own creditos"
ON public.creditos_diagnostico FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage creditos"
ON public.creditos_diagnostico FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Bloqueia escrita direta do cliente (só service role / admin / função SECURITY DEFINER)
CREATE POLICY "No client insert creditos" ON public.creditos_diagnostico
AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "No client update creditos" ON public.creditos_diagnostico
AS RESTRICTIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "No client delete creditos" ON public.creditos_diagnostico
AS RESTRICTIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- =========================
-- Funções utilitárias
-- =========================

-- Conta créditos disponíveis de um usuário
CREATE OR REPLACE FUNCTION public.creditos_disponiveis(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.creditos_diagnostico
  WHERE user_id = _user_id AND diagnostico_id IS NULL;
$$;

-- Consome 1 crédito do usuário autenticado e vincula ao diagnostico_id
CREATE OR REPLACE FUNCTION public.consumir_credito_diagnostico(_diagnostico_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _credito_id uuid;
  _diag_user uuid;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;

  -- Garante que o diagnóstico pertence ao usuário
  SELECT user_id INTO _diag_user FROM public.diagnosticos WHERE id = _diagnostico_id;
  IF _diag_user IS NULL OR _diag_user <> _user_id THEN
    RAISE EXCEPTION 'diagnostico inválido';
  END IF;

  -- Se este diagnóstico já consumiu crédito antes, retorna true (idempotente)
  IF EXISTS (SELECT 1 FROM public.creditos_diagnostico WHERE diagnostico_id = _diagnostico_id) THEN
    RETURN true;
  END IF;

  -- Pega o crédito mais antigo disponível, com lock
  SELECT id INTO _credito_id
  FROM public.creditos_diagnostico
  WHERE user_id = _user_id AND diagnostico_id IS NULL
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF _credito_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.creditos_diagnostico
  SET diagnostico_id = _diagnostico_id, consumido_em = now()
  WHERE id = _credito_id;

  RETURN true;
END;
$$;

-- =========================
-- Trigger: novo usuário ganha 1 crédito de cortesia
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Crédito de cortesia (estratégia de vendas — não exposto como "gratuito" na UI)
  INSERT INTO public.creditos_diagnostico (user_id, origem, email_comprador, metadata)
  VALUES (NEW.id, 'cortesia', NEW.email, jsonb_build_object('source','signup'));

  RETURN NEW;
END;
$$;

-- Garante o trigger no auth.users (idempotente)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- Backfill: dá 1 crédito de cortesia a usuários existentes que ainda não têm crédito algum
-- =========================
INSERT INTO public.creditos_diagnostico (user_id, origem, email_comprador, metadata)
SELECT u.id, 'cortesia', u.email, jsonb_build_object('source','backfill')
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.creditos_diagnostico c WHERE c.user_id = u.id
);

-- =========================
-- Permite leitura pública (autenticada) das settings de pagamento
-- =========================
DROP POLICY IF EXISTS "Authenticated read public settings" ON public.app_settings;
CREATE POLICY "Authenticated read public settings"
ON public.app_settings FOR SELECT
TO authenticated
USING (
  key = ANY (ARRAY[
    'agendamento_url','agendamento_modo','agendamento_titulo',
    'pagamento_titulo','pagamento_descricao','pagamento_checkouts'
  ])
  OR has_role(auth.uid(), 'admin'::app_role)
);