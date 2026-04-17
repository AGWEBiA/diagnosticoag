DROP POLICY IF EXISTS "Authenticated read public settings" ON public.app_settings;

CREATE POLICY "Authenticated read public settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (
  key = ANY (ARRAY[
    'agendamento'::text,
    'agendamento_url'::text,
    'agendamento_modo'::text,
    'agendamento_titulo'::text,
    'pagamento'::text,
    'pagamento_titulo'::text,
    'pagamento_descricao'::text,
    'pagamento_checkouts'::text
  ])
  OR has_role(auth.uid(), 'admin'::app_role)
);