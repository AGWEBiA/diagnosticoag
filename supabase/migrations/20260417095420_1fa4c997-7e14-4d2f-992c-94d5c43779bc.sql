-- Restrictive policies bloqueiam toda escrita do cliente, mesmo se outras policies permissivas existirem.
-- Service role bypassa RLS, então o backend continua funcionando.

-- audit_log: nenhum cliente escreve
CREATE POLICY "No client writes audit_log insert"
ON public.audit_log AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "No client writes audit_log update"
ON public.audit_log AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (false) WITH CHECK (false);

CREATE POLICY "No client writes audit_log delete"
ON public.audit_log AS RESTRICTIVE
FOR DELETE TO authenticated
USING (false);

-- audit_trail_ia: idem
CREATE POLICY "No client writes audit_trail_ia insert"
ON public.audit_trail_ia AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "No client writes audit_trail_ia update"
ON public.audit_trail_ia AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (false) WITH CHECK (false);

CREATE POLICY "No client writes audit_trail_ia delete"
ON public.audit_trail_ia AS RESTRICTIVE
FOR DELETE TO authenticated
USING (false);

-- operacoes_ia: cliente nunca escreve (só leitura própria + admin gerencia já existem)
CREATE POLICY "No client writes operacoes_ia insert"
ON public.operacoes_ia AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "No client writes operacoes_ia update"
ON public.operacoes_ia AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (false) WITH CHECK (false);

CREATE POLICY "No client writes operacoes_ia delete"
ON public.operacoes_ia AS RESTRICTIVE
FOR DELETE TO authenticated
USING (false);

-- storage.objects bucket 'relatorios': cliente não envia/altera/exclui
CREATE POLICY "No client writes relatorios insert"
ON storage.objects AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (bucket_id <> 'relatorios');

CREATE POLICY "No client writes relatorios update"
ON storage.objects AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (bucket_id <> 'relatorios') WITH CHECK (bucket_id <> 'relatorios');

CREATE POLICY "No client writes relatorios delete"
ON storage.objects AS RESTRICTIVE
FOR DELETE TO authenticated
USING (bucket_id <> 'relatorios');