-- Configurações globais da aplicação (key/value)
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode LER (precisa ler URL de agendamento)
CREATE POLICY "Authenticated read settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (true);

-- Apenas admins podem inserir/atualizar/deletar
CREATE POLICY "Admins manage settings"
ON public.app_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: chave de agendamento (vazia, admin preenche depois)
INSERT INTO public.app_settings (key, value)
VALUES ('agendamento', '{"url": "", "titulo": "Agende sua reunião", "descricao": "Escolha o melhor horário para conversarmos sobre seu diagnóstico."}'::jsonb)
ON CONFLICT (key) DO NOTHING;