// Helpers de RAG: query a partir das respostas + recuperação via match_knowledge.
import { generateEmbedding } from "./embeddings.ts";

export interface RagItem {
  titulo: string;
  conteudo: string;
  categoria: string | null;
  similarity: number;
}

export function buildQueryFromRespostas(respostas: Record<string, unknown>): string {
  const parts: string[] = [];
  if (respostas.segmento) parts.push(`Segmento: ${respostas.segmento}`);
  if (respostas.faturamento_mensal) parts.push(`Faturamento: ${respostas.faturamento_mensal}`);
  if (respostas.maior_gargalo) parts.push(`Gargalo: ${respostas.maior_gargalo}`);
  if (respostas.estrategia_maior_retorno)
    parts.push(`Estratégia top: ${respostas.estrategia_maior_retorno}`);
  if (respostas.estrategia_menor_retorno)
    parts.push(`Estratégia fraca: ${respostas.estrategia_menor_retorno}`);
  return parts.join(". ") || "diagnóstico de negócio digital";
}

// deno-lint-ignore no-explicit-any
export async function searchKnowledge(supabaseAdmin: any, query: string, opts?: {
  threshold?: number;
  count?: number;
}): Promise<RagItem[]> {
  try {
    const emb = await generateEmbedding(query);
    const { data: matches, error } = await supabaseAdmin.rpc("match_knowledge", {
      query_embedding: emb.vector as unknown as string,
      match_threshold: opts?.threshold ?? 0.5,
      match_count: opts?.count ?? 5,
    });
    if (error || !Array.isArray(matches)) return [];
    // deno-lint-ignore no-explicit-any
    return matches.map((m: any) => ({
      titulo: m.titulo,
      conteudo: m.conteudo,
      categoria: m.categoria,
      similarity: m.similarity,
    }));
  } catch (e) {
    console.warn("RAG falhou, prosseguindo sem contexto:", e);
    return [];
  }
}

export function formatRagContext(items: RagItem[]): string {
  if (items.length === 0) return "(nenhum contexto adicional disponível)";
  return items
    .map((c, i) => `[${i + 1}] (${c.categoria ?? "geral"}) ${c.titulo}\n${c.conteudo}`)
    .join("\n\n---\n\n");
}
