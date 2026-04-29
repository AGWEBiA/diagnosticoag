
ALTER TABLE public.produtos_pagamento
  ADD COLUMN IF NOT EXISTS sla_horas integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS requer_aprovacao boolean NOT NULL DEFAULT true;

ALTER TABLE public.diagnosticos
  ADD COLUMN IF NOT EXISTS sla_horas integer,
  ADD COLUMN IF NOT EXISTS requer_aprovacao boolean,
  ADD COLUMN IF NOT EXISTS enviado_em timestamptz,
  ADD COLUMN IF NOT EXISTS aprovado_em timestamptz,
  ADD COLUMN IF NOT EXISTS aprovado_por uuid,
  ADD COLUMN IF NOT EXISTS liberado_em timestamptz,
  ADD COLUMN IF NOT EXISTS notas_admin text,
  ADD COLUMN IF NOT EXISTS analise jsonb;

CREATE INDEX IF NOT EXISTS diagnosticos_status_liberacao_idx
  ON public.diagnosticos (status, enviado_em)
  WHERE status = 'aguardando_aprovacao';

CREATE TABLE IF NOT EXISTS public.diagnostico_aprovacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  decisao text NOT NULL CHECK (decisao IN ('aprovado','reprovado')),
  motivo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostico_aprovacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage aprovacoes" ON public.diagnostico_aprovacoes;
CREATE POLICY "Admins manage aprovacoes"
  ON public.diagnostico_aprovacoes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Aprovar
CREATE OR REPLACE FUNCTION public.aprovar_diagnostico(
  _diagnostico_id uuid,
  _notas text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id uuid := auth.uid();
BEGIN
  IF NOT has_role(_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas admins podem aprovar diagnósticos';
  END IF;

  UPDATE public.diagnosticos
  SET aprovado_em = now(),
      aprovado_por = _admin_id,
      notas_admin = COALESCE(_notas, notas_admin)
  WHERE id = _diagnostico_id
    AND status = 'aguardando_aprovacao'::diagnostico_status
    AND aprovado_em IS NULL;

  INSERT INTO public.diagnostico_aprovacoes (diagnostico_id, admin_id, decisao, motivo)
  VALUES (_diagnostico_id, _admin_id, 'aprovado', _notas);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.aprovar_diagnostico(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.aprovar_diagnostico(uuid, text) TO authenticated;

-- Reprovar
CREATE OR REPLACE FUNCTION public.reprovar_diagnostico(
  _diagnostico_id uuid,
  _motivo text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id uuid := auth.uid();
BEGIN
  IF NOT has_role(_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas admins podem reprovar diagnósticos';
  END IF;
  IF _motivo IS NULL OR length(trim(_motivo)) < 5 THEN
    RAISE EXCEPTION 'Motivo é obrigatório (mín. 5 caracteres)';
  END IF;

  UPDATE public.diagnosticos
  SET status = 'reprovado'::diagnostico_status,
      notas_admin = _motivo
  WHERE id = _diagnostico_id;

  INSERT INTO public.diagnostico_aprovacoes (diagnostico_id, admin_id, decisao, motivo)
  VALUES (_diagnostico_id, _admin_id, 'reprovado', _motivo);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reprovar_diagnostico(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.reprovar_diagnostico(uuid, text) TO authenticated;

-- Libera os pendentes (aprovados + SLA cumprido). Só pode ser chamada por service_role (cron).
CREATE OR REPLACE FUNCTION public.liberar_diagnosticos_pendentes()
RETURNS TABLE(diagnostico_id uuid, user_id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH liberados AS (
    UPDATE public.diagnosticos d
    SET status = 'liberado'::diagnostico_status,
        liberado_em = now(),
        concluido_em = COALESCE(d.concluido_em, now())
    WHERE d.status = 'aguardando_aprovacao'::diagnostico_status
      AND d.aprovado_em IS NOT NULL
      AND d.enviado_em IS NOT NULL
      AND d.enviado_em + (COALESCE(d.sla_horas, 24) || ' hours')::interval <= now()
    RETURNING d.id, d.user_id
  )
  SELECT l.id, l.user_id, p.email
  FROM liberados l
  LEFT JOIN public.profiles p ON p.id = l.user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.liberar_diagnosticos_pendentes() FROM anon, public, authenticated;
