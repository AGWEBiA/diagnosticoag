UPDATE public.diagnosticos
SET status = 'em_analise'::diagnostico_status,
    concluido_em = NULL
WHERE id = 'ac73cb9d-5293-40cd-852e-cd0afb9eea8f';