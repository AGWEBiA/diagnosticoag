-- Bucket privado para relatórios em PDF
INSERT INTO storage.buckets (id, name, public)
VALUES ('relatorios', 'relatorios', false)
ON CONFLICT (id) DO NOTHING;

-- SELECT: dono da pasta (1º segmento = user_id) ou admin
CREATE POLICY "Owners read own reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'relatorios'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Sem policies de INSERT/UPDATE/DELETE para clientes:
-- escrita acontece apenas via service role (edge function gerar-pdf-diagnostico).