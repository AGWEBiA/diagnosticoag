// Shared embedding helper.
// Auto-detects provider: if OPENAI_API_KEY is set, uses OpenAI (1536d).
// Otherwise falls back to Lovable AI Gateway (Gemini 768d, padded to 1536d).

const TARGET_DIM = 1536;

export type EmbeddingProvider = "openai" | "lovable";

export interface EmbeddingResult {
  embedding: number[];
  provider: EmbeddingProvider;
  model: string;
  tokensInput: number;
}

/** Pad or truncate a vector to a fixed length so all providers share the same column. */
function normalizeDim(vec: number[], targetDim: number): number[] {
  if (vec.length === targetDim) return vec;
  if (vec.length > targetDim) return vec.slice(0, targetDim);
  return [...vec, ...new Array(targetDim - vec.length).fill(0)];
}

async function embedWithOpenAI(text: string, apiKey: string): Promise<EmbeddingResult> {
  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`OpenAI embeddings failed [${resp.status}]: ${errText}`);
  }

  const data = await resp.json();
  const embedding = data?.data?.[0]?.embedding as number[] | undefined;
  if (!embedding) throw new Error("OpenAI embeddings returned no vector");

  return {
    embedding: normalizeDim(embedding, TARGET_DIM),
    provider: "openai",
    model: "text-embedding-3-small",
    tokensInput: data?.usage?.prompt_tokens ?? 0,
  };
}

async function embedWithLovable(text: string, apiKey: string): Promise<EmbeddingResult> {
  // Lovable AI Gateway is OpenAI-compatible for /v1/embeddings.
  // We use Google's text-embedding-004 (768d) and pad to 1536.
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/text-embedding-004",
      input: text,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    if (resp.status === 429) throw new Error("Rate limit excedido no Lovable AI Gateway, tente novamente em instantes.");
    if (resp.status === 402) throw new Error("Créditos esgotados no Lovable AI. Adicione créditos em Settings → Workspace → Usage.");
    throw new Error(`Lovable AI embeddings failed [${resp.status}]: ${errText}`);
  }

  const data = await resp.json();
  const embedding = data?.data?.[0]?.embedding as number[] | undefined;
  if (!embedding) throw new Error("Lovable AI embeddings returned no vector");

  return {
    embedding: normalizeDim(embedding, TARGET_DIM),
    provider: "lovable",
    model: "google/text-embedding-004",
    tokensInput: data?.usage?.prompt_tokens ?? Math.ceil(text.length / 4),
  };
}

/** Generate an embedding using the best available provider. */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  if (!text || !text.trim()) {
    throw new Error("Texto vazio não pode ser convertido em embedding");
  }

  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (openaiKey) {
    return await embedWithOpenAI(text, openaiKey);
  }

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (lovableKey) {
    return await embedWithLovable(text, lovableKey);
  }

  throw new Error(
    "Nenhuma API key de embeddings configurada. Adicione OPENAI_API_KEY ou aguarde o Lovable Cloud configurar LOVABLE_API_KEY."
  );
}
