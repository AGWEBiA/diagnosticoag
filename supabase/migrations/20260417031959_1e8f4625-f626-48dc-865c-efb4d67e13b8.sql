-- Drop dependent index and function first
DROP INDEX IF EXISTS public.idx_knowledge_embedding;
DROP FUNCTION IF EXISTS public.match_knowledge(vector, double precision, integer);

-- Change embedding column to 768 dimensions (Gemini text-embedding-004)
ALTER TABLE public.knowledge_base
  ALTER COLUMN embedding TYPE vector(768);

-- Recreate index
CREATE INDEX idx_knowledge_embedding
  ON public.knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Recreate semantic search RPC with new dimension
CREATE OR REPLACE FUNCTION public.match_knowledge(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  conteudo TEXT,
  categoria TEXT,
  fonte TEXT,
  similarity FLOAT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    kb.id,
    kb.titulo,
    kb.conteudo,
    kb.categoria,
    kb.fonte,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_base kb
  WHERE kb.status = 'aprovado'
    AND kb.embedding IS NOT NULL
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
$$;