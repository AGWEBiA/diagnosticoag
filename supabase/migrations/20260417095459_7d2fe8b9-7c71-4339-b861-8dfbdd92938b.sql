-- 1) app_settings: restringir SELECT do cliente a uma allowlist de chaves públicas
DROP POLICY IF EXISTS "Authenticated read settings" ON public.app_settings;

CREATE POLICY "Authenticated read public settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (
  key IN ('agendamento_url', 'agendamento_modo', 'agendamento_titulo')
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 2) user_roles: RESTRICTIVE explícita garante que escrita só ocorre se admin
CREATE POLICY "Only admins write roles insert"
ON public.user_roles AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins write roles update"
ON public.user_roles AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins write roles delete"
ON public.user_roles AS RESTRICTIVE
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));