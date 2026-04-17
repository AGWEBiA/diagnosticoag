// Edge function: process-diagnostico
// Processa um diagnóstico (status='em_analise'), faz RAG via match_knowledge
// e gera resumo executivo + recomendações + score usando Lovable AI Gateway.
// Atualiza diagnostico para 'concluido' e registra audit_trail_ia + operacoes_ia.
// Hardening: retry com fallback de modelo, custo_usd real, auto-flag confiança baixa.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { generateEmbedding } from "../_shared/embeddings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

// Modelo primário e fallback
const PRIMARY_MODEL = "google/gemini-2.5-flash";
const FALLBACK_MODEL = "google/gemini-2.5-pro";

// Preços USD por 1M tokens (Lovable AI Gateway — aproximação para auditoria)
const PRICES_PER_1M: Record<string, { in: number; out: number }> = {
  "google/gemini-2.5-flash": { in: 0.075, out: 0.30 },
  "google/gemini-2.5-pro": { in: 1.25, out: 5.00 },
  "google/gemini-2.5-flash-lite": { in: 0.0375, out: 0.15 },
};

const FLAG_THRESHOLD = 0.6;

interface AnaliseEstruturada {
  resumo_executivo: string;
  score: number;
  confianca: number;
  recomendacoes: Array<{
    titulo: string;
    descricao: string;
    prioridade: "alta" | "media" | "baixa";
    categoria: string;
    impacto_estimado: string;
  }>;
}

function calcCustoUsd(model: string, tin: number, tout: number): number {
  const p = PRICES_PER_1M[model];
  if (!p) return 0;
  return (tin / 1_000_000) * p.in + (tout / 1_000_000) * p.out;
}

function buildQueryFromRespostas(respostas: Record<string, unknown>): string {
  const parts: string[] = [];
  if (respostas.segmento) parts.push(`Segmento: ${respostas.segmento}`);
  if (respostas.faturamento_mensal)
    parts.push(`Faturamento: ${respostas.faturamento_mensal}`);
  if (respostas.maior_gargalo) parts.push(`Gargalo: ${respostas.maior_gargalo}`);
  if (respostas.estrategia_maior_retorno)
    parts.push(`Estratégia top: ${respostas.estrategia_maior_retorno}`);
  if (respostas.estrategia_menor_retorno)
    parts.push(`Estratégia fraca: ${respostas.estrategia_menor_retorno}`);
  return parts.join(". ") || "diagnóstico de negócio digital";
}

function buildSystemPrompt(): string {
  return `Você é um consultor sênior especializado em negócios digitais (infoprodutos, marketing digital, SaaS).
Sua tarefa: gerar um diagnóstico ESTRATÉGICO baseado nas respostas do usuário e no CONTEXTO de conhecimento verificado fornecido.

REGRAS CRÍTICAS ANTI-ALUCINAÇÃO:
1. Use APENAS informações presentes nas respostas do usuário ou no CONTEXTO RAG.
2. NÃO invente números, métricas, benchmarks ou citações.
3. Se faltar informação, recomende coletar dados adicionais — não chute.
4. Seja específico e acionável; evite generalidades.
5. Recomendações devem ser priorizadas pelo impacto no gargalo principal.
6. Score (0-100) reflete maturidade do negócio: <30 inicial, 30-60 em desenvolvimento, 60-85 estabelecido, >85 maduro.
7. Confiança (0-1): quanto mais respostas completas + contexto RAG relevante, maior.

Retorne SEMPRE via tool call structured.`;
}

async function callAIOnce(
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<{ data: AnaliseEstruturada; tokens_in: number; tokens_out: number }> {
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const response = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_diagnostico",
              description: "Retorna o diagnóstico estruturado.",
              parameters: {
                type: "object",
                properties: {
                  resumo_executivo: { type: "string" },
                  score: { type: "number" },
                  confianca: { type: "number" },
                  recomendacoes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        titulo: { type: "string" },
                        descricao: { type: "string" },
                        prioridade: {
                          type: "string",
                          enum: ["alta", "media", "baixa"],
                        },
                        categoria: { type: "string" },
                        impacto_estimado: { type: "string" },
                      },
                      required: [
                        "titulo",
                        "descricao",
                        "prioridade",
                        "categoria",
                        "impacto_estimado",
                      ],
                      additionalProperties: false,
                    },
                  },
                },
                required: [
                  "resumo_executivo",
                  "score",
                  "confianca",
                  "recomendacoes",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "submit_diagnostico" },
        },
      }),
    },
  );

  if (!response.ok) {
    if (response.status === 429) throw new Error("rate_limit");
    if (response.status === 402) throw new Error("payment_required");
    if (response.status >= 500) throw new Error(`upstream_${response.status}`);
    const t = await response.text();
    throw new Error(`AI gateway error ${response.status}: ${t}`);
  }

  const json = await response.json();
  const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("AI did not return tool_call");
  const data = JSON.parse(toolCall.function.arguments) as AnaliseEstruturada;

  return {
    data,
    tokens_in: json.usage?.prompt_tokens ?? 0,
    tokens_out: json.usage?.completion_tokens ?? 0,
  };
}

// Tenta modelo primário; em rate_limit/upstream_5xx, faz 1 retry no fallback.
async function callAIWithFallback(
  systemPrompt: string,
  userPrompt: string,
): Promise<{
  data: AnaliseEstruturada;
  tokens_in: number;
  tokens_out: number;
  modelo_usado: string;
  fallback_usado: boolean;
}> {
  try {
    const r = await callAIOnce(PRIMARY_MODEL, systemPrompt, userPrompt);
    return { ...r, modelo_usado: PRIMARY_MODEL, fallback_usado: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const retriable =
      msg === "rate_limit" || msg.startsWith("upstream_5");
    if (!retriable) throw e;
    console.warn(
      `Primary model ${PRIMARY_MODEL} falhou (${msg}); tentando fallback ${FALLBACK_MODEL}`,
    );
    const r = await callAIOnce(FALLBACK_MODEL, systemPrompt, userPrompt);
    return { ...r, modelo_usado: FALLBACK_MODEL, fallback_usado: true };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const body = await req.json().catch(() => ({}));
    const diagnosticoId = body?.diagnostico_id as string | undefined;
    if (!diagnosticoId) {
      return new Response(
        JSON.stringify({ error: "diagnostico_id required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    );

    const { data: diag, error: diagErr } = await supabaseAdmin
      .from("diagnosticos")
      .select("id, user_id, respostas, segmento, status")
      .eq("id", diagnosticoId)
      .single();

    if (diagErr || !diag) {
      return new Response(JSON.stringify({ error: "Diagnóstico não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (diag.user_id !== userId) {
      const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (diag.status === "concluido") {
      return new Response(
        JSON.stringify({ ok: true, already: true, diagnostico_id: diag.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const respostas = (diag.respostas ?? {}) as Record<string, unknown>;

    // RAG
    const query = buildQueryFromRespostas(respostas);
    let ragContexto: Array<{
      titulo: string;
      conteudo: string;
      categoria: string | null;
      similarity: number;
    }> = [];

    try {
      const emb = await generateEmbedding(query);
      const { data: matches, error: matchErr } = await supabaseAdmin.rpc(
        "match_knowledge",
        {
          query_embedding: emb.vector as unknown as string,
          match_threshold: 0.5,
          match_count: 5,
        },
      );
      if (!matchErr && Array.isArray(matches)) {
        ragContexto = matches.map((m: any) => ({
          titulo: m.titulo,
          conteudo: m.conteudo,
          categoria: m.categoria,
          similarity: m.similarity,
        }));
      }
    } catch (e) {
      console.warn("RAG falhou, prosseguindo sem contexto:", e);
    }

    const contextoTexto =
      ragContexto.length > 0
        ? ragContexto
            .map(
              (c, i) =>
                `[${i + 1}] (${c.categoria ?? "geral"}) ${c.titulo}\n${c.conteudo}`,
            )
            .join("\n\n---\n\n")
        : "(nenhum contexto adicional disponível)";

    const userPrompt = `# RESPOSTAS DO USUÁRIO
\`\`\`json
${JSON.stringify(respostas, null, 2)}
\`\`\`

# CONTEXTO DE CONHECIMENTO VERIFICADO (RAG)
${contextoTexto}

# TAREFA
Gere um diagnóstico estratégico estruturado para este negócio (segmento: ${diag.segmento ?? "não informado"}). Foque no maior gargalo declarado e em recomendações acionáveis nos próximos 90 dias.`;

    const systemPrompt = buildSystemPrompt();

    let analise: AnaliseEstruturada;
    let tokens_in = 0;
    let tokens_out = 0;
    let modeloUsado = PRIMARY_MODEL;
    let fallbackUsado = false;
    try {
      const result = await callAIWithFallback(systemPrompt, userPrompt);
      analise = result.data;
      tokens_in = result.tokens_in;
      tokens_out = result.tokens_out;
      modeloUsado = result.modelo_usado;
      fallbackUsado = result.fallback_usado;
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabaseAdmin.from("operacoes_ia").insert({
        user_id: userId,
        diagnostico_id: diagnosticoId,
        tipo: "process_diagnostico",
        modelo: PRIMARY_MODEL,
        provider: "lovable_ai",
        sucesso: false,
        erro: msg,
        duracao_ms: Date.now() - startedAt,
      });

      if (msg === "rate_limit") {
        return new Response(
          JSON.stringify({
            error: "Rate limit excedido. Tente novamente em alguns instantes.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (msg === "payment_required") {
        return new Response(
          JSON.stringify({
            error:
              "Créditos de IA insuficientes. Adicione créditos no workspace.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      throw e;
    }

    // Atualiza diagnóstico
    const { error: updErr } = await supabaseAdmin
      .from("diagnosticos")
      .update({
        status: "concluido",
        resumo_executivo: analise.resumo_executivo,
        recomendacoes: analise.recomendacoes,
        score: Math.round(analise.score),
        confianca_score: analise.confianca,
        rag_contexto: ragContexto,
        concluido_em: new Date().toISOString(),
      })
      .eq("id", diagnosticoId);

    if (updErr) throw updErr;

    // Auto-flag por baixa confiança ou fallback usado
    const flagged = analise.confianca < FLAG_THRESHOLD || fallbackUsado;
    let flag_motivo: string | null = null;
    if (analise.confianca < FLAG_THRESHOLD) {
      flag_motivo = `baixa_confianca (${analise.confianca.toFixed(2)} < ${FLAG_THRESHOLD})`;
    } else if (fallbackUsado) {
      flag_motivo = `fallback_modelo (${PRIMARY_MODEL} -> ${modeloUsado})`;
    }

    await supabaseAdmin.from("audit_trail_ia").insert({
      user_id: userId,
      diagnostico_id: diagnosticoId,
      prompt: userPrompt.slice(0, 10000),
      resposta: JSON.stringify(analise).slice(0, 10000),
      modelo: modeloUsado,
      confianca: analise.confianca,
      contexto_rag: ragContexto,
      flagged,
      flag_motivo,
    });

    const custoUsd = calcCustoUsd(modeloUsado, tokens_in, tokens_out);

    await supabaseAdmin.from("operacoes_ia").insert({
      user_id: userId,
      diagnostico_id: diagnosticoId,
      tipo: "process_diagnostico",
      modelo: modeloUsado,
      provider: "lovable_ai",
      sucesso: true,
      tokens_input: tokens_in,
      tokens_output: tokens_out,
      custo_usd: Number(custoUsd.toFixed(6)),
      duracao_ms: Date.now() - startedAt,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        diagnostico_id: diagnosticoId,
        score: Math.round(analise.score),
        confianca: analise.confianca,
        modelo: modeloUsado,
        fallback_usado: fallbackUsado,
        flagged,
        recomendacoes_count: analise.recomendacoes.length,
        rag_contexto_count: ragContexto.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("process-diagnostico error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
