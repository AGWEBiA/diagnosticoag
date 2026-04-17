-- Drop existing SELECT policies on storage.objects for the 'relatorios' bucket
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (policyname ILIKE '%relatorios%' OR policyname ILIKE '%reports%' OR policyname ILIKE '%report%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- New, stricter SELECT policy: must exist in relatorios_pdf and be owned by the requester (or admin)
CREATE POLICY "Read relatorios via ownership table"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'relatorios'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.relatorios_pdf rp
      WHERE rp.storage_path = storage.objects.name
        AND rp.user_id = auth.uid()
    )
  )
);

-- Block any client-side writes to the relatorios bucket; only service_role (edge functions) may write
CREATE POLICY "No client insert relatorios"
ON storage.objects AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (bucket_id <> 'relatorios');

CREATE POLICY "No client update relatorios"
ON storage.objects AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (bucket_id <> 'relatorios')
WITH CHECK (bucket_id <> 'relatorios');

CREATE POLICY "No client delete relatorios"
ON storage.objects AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (bucket_id <> 'relatorios');