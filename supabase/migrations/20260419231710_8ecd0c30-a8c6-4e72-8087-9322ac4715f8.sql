UPDATE public.diagnosticos
SET status = 'em_analise',
    resumo_executivo = NULL,
    recomendacoes = NULL,
    score = NULL,
    concluido_em = NULL,
    rag_contexto = NULL,
    confianca_score = NULL
WHERE id = 'ac73cb9d-5293-40cd-852e-cd0afb9eea8f';