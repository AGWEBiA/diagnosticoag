-- 1) Novo status: bloqueado
ALTER TYPE public.diagnostico_status ADD VALUE IF NOT EXISTS 'bloqueado';

-- 2) Produtos: dias de carência do PDF e taxa estimada do gateway
ALTER TABLE public.produtos_pagamento
  ADD COLUMN IF NOT EXISTS pdf_disponivel_apos_dias integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS taxa_gateway_pct numeric(5,2) NOT NULL DEFAULT 0;

-- 3) Diagnósticos: campos de bloqueio
ALTER TABLE public.diagnosticos
  ADD COLUMN IF NOT EXISTS bloqueado_em timestamptz,
  ADD COLUMN IF NOT EXISTS bloqueado_por uuid,
  ADD COLUMN IF NOT EXISTS bloqueio_motivo text,
  ADD COLUMN IF NOT EXISTS status_anterior_bloqueio public.diagnostico_status;

-- 4) Créditos: valores financeiros detalhados
ALTER TABLE public.creditos_diagnostico
  ADD COLUMN IF NOT EXISTS valor_bruto_centavos integer,
  ADD COLUMN IF NOT EXISTS taxa_gateway_centavos integer,
  ADD COLUMN IF NOT EXISTS comissao_produtor_centavos integer,
  ADD COLUMN IF NOT EXISTS comissao_coprodutor_centavos integer,
  ADD COLUMN IF NOT EXISTS comissao_afiliado_centavos integer,
  ADD COLUMN IF NOT EXISTS valor_liquido_centavos integer,
  ADD COLUMN IF NOT EXISTS moeda text DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS estornado_em timestamptz,
  ADD COLUMN IF NOT EXISTS estorno_motivo text;

CREATE INDEX IF NOT EXISTS idx_creditos_transacao ON public.creditos_diagnostico (transacao_externa_id);
CREATE INDEX IF NOT EXISTS idx_creditos_created_at ON public.creditos_diagnostico (created_at);
CREATE INDEX IF NOT EXISTS idx_operacoes_ia_created_at ON public.operacoes_ia (created_at);

-- 5) Função: bloquear diagnóstico (admin manual)
CREATE OR REPLACE FUNCTION public.bloquear_diagnostico(
  _diagnostico_id uuid,
  _motivo text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin_id uuid := auth.uid();
  _status_atual public.diagnostico_status;
BEGIN
  IF NOT has_role(_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas admins podem bloquear diagnósticos';
  END IF;
  IF _motivo IS NULL OR length(trim(_motivo)) < 5 THEN
    RAISE EXCEPTION 'Motivo é obrigatório (mín. 5 caracteres)';
  END IF;

  SELECT status INTO _status_atual FROM public.diagnosticos WHERE id = _diagnostico_id;
  IF _status_atual IS NULL THEN
    RAISE EXCEPTION 'Diagnóstico não encontrado';
  END IF;
  IF _status_atual = 'bloqueado'::public.diagnostico_status THEN
    RETURN;
  END IF;

  UPDATE public.diagnosticos
  SET status_anterior_bloqueio = _status_atual,
      status = 'bloqueado'::public.diagnostico_status,
      bloqueado_em = now(),
      bloqueado_por = _admin_id,
      bloqueio_motivo = _motivo
  WHERE id = _diagnostico_id;

  INSERT INTO public.audit_log (user_id, acao, entidade, entidade_id, metadata)
  VALUES (_admin_id, 'bloquear_diagnostico', 'diagnostico', _diagnostico_id,
          jsonb_build_object('motivo', _motivo, 'status_anterior', _status_atual));
END;
$$;

-- 6) Função: desbloquear diagnóstico
CREATE OR REPLACE FUNCTION public.desbloquear_diagnostico(_diagnostico_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin_id uuid := auth.uid();
  _anterior public.diagnostico_status;
BEGIN
  IF NOT has_role(_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas admins podem desbloquear';
  END IF;

  SELECT status_anterior_bloqueio INTO _anterior
  FROM public.diagnosticos WHERE id = _diagnostico_id;

  UPDATE public.diagnosticos
  SET status = COALESCE(_anterior, 'liberado'::public.diagnostico_status),
      bloqueado_em = NULL,
      bloqueado_por = NULL,
      bloqueio_motivo = NULL,
      status_anterior_bloqueio = NULL
  WHERE id = _diagnostico_id
    AND status = 'bloqueado'::public.diagnostico_status;

  INSERT INTO public.audit_log (user_id, acao, entidade, entidade_id, metadata)
  VALUES (_admin_id, 'desbloquear_diagnostico', 'diagnostico', _diagnostico_id, '{}'::jsonb);
END;
$$;

-- 7) Função: bloquear diagnósticos por transação estornada (chamada pelos webhooks via service role)
CREATE OR REPLACE FUNCTION public.bloquear_por_transacao_estornada(
  _transacao_id text,
  _motivo text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _count int := 0;
BEGIN
  -- Marca créditos como estornados
  UPDATE public.creditos_diagnostico
  SET estornado_em = COALESCE(estornado_em, now()),
      estorno_motivo = COALESCE(estorno_motivo, _motivo)
  WHERE transacao_externa_id = _transacao_id;

  -- Bloqueia diagnósticos vinculados a esses créditos
  WITH afetados AS (
    UPDATE public.diagnosticos d
    SET status_anterior_bloqueio = COALESCE(d.status_anterior_bloqueio, d.status),
        status = 'bloqueado'::public.diagnostico_status,
        bloqueado_em = COALESCE(d.bloqueado_em, now()),
        bloqueio_motivo = COALESCE(d.bloqueio_motivo, _motivo)
    FROM public.creditos_diagnostico c
    WHERE c.transacao_externa_id = _transacao_id
      AND c.diagnostico_id = d.id
      AND d.status <> 'bloqueado'::public.diagnostico_status
    RETURNING d.id
  )
  SELECT count(*) INTO _count FROM afetados;

  INSERT INTO public.audit_log (acao, entidade, metadata)
  VALUES ('estorno_webhook', 'transacao',
          jsonb_build_object('transacao_id', _transacao_id, 'motivo', _motivo, 'diagnosticos_bloqueados', _count));

  RETURN _count;
END;
$$;