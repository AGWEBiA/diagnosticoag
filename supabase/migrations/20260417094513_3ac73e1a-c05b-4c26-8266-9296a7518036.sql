-- 1) profiles: restringir SELECT ao próprio usuário (admins ainda enxergam tudo via has_role)
DROP POLICY IF EXISTS "Profiles viewable by everyone authenticated" ON public.profiles;

CREATE POLICY "Users read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));

-- 2) audit_log: remover INSERT do cliente; só service role escreve
DROP POLICY IF EXISTS "Authenticated insert audit log" ON public.audit_log;

-- 3) audit_trail_ia: restringir INSERT ao service role (remover policy do cliente)
DROP POLICY IF EXISTS "Backend writes audit trail" ON public.audit_trail_ia;

-- 4) user_roles: reforçar — garantir que apenas admins podem INSERT/UPDATE/DELETE
-- A policy "Only admins manage roles" (ALL) já cobre, mas vamos garantir que não há policies permissivas extras
-- e adicionar policies explícitas separadas para clareza
DROP POLICY IF EXISTS "Only admins manage roles" ON public.user_roles;

CREATE POLICY "Admins insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));