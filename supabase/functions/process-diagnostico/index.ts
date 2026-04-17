// Edge function: process-diagnostico
// Processa um diagnóstico (status='em_analise'), faz RAG via match_knowledge
// e gera resumo executivo + recomendações + score usando Lovable AI Gateway.
// Hardening: retry com fallback de modelo, custo_usd real, auto-flag confiança baixa.
// Refatorado: lógica de IA, RAG e pricing extraídas para _shared/.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { calcCustoUsd } from "../_shared/pricing.ts";
import { callAIWithFallback } from "../_shared/ai-client.ts";
import { buildQueryFromRespostas, formatRagContext, searchKnowledge } from "../_shared/rag.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

const PRIMARY_MODEL = "google/gemini-2.5-flash";
const FALLBACK_MODEL = "google/gemini-2.5-pro";
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

const TOOL_DEFINITION = {
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
            prioridade: { type: "string", enum: ["alta", "media", "baixa"] },
            categoria: { type: "string" },
            impacto_estimado: { type: "string" },
          },
          required: ["titulo", "descricao", "prioridade", "categoria", "impacto_estimado"],
          additionalProperties: false,
        },
      },
    },
    required: ["resumo_executivo", "score", "confianca", "recomendacoes"],
    additionalProperties: false,
  },
};

const SYSTEM_PROMPT = `Você é um consultor sênior especializado em negócios digitais (infoprodutos, marketing digital, SaaS).
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
      return new Response(JSON.stringify({ error: "diagnostico_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    const ragQuery = buildQueryFromRespostas(respostas);
    const ragContexto = await searchKnowledge(supabaseAdmin, ragQuery);
    const contextoTexto = formatRagContext(ragContexto);

    const userPrompt = `# RESPOSTAS DO USUÁRIO
\`\`\`json
${JSON.stringify(respostas, null, 2)}
\`\`\`

# CONTEXTO DE CONHECIMENTO VERIFICADO (RAG)
${contextoTexto}

# TAREFA
Gere um diagnóstico estratégico estruturado para este negócio (segmento: ${diag.segmento ?? "não informado"}). Foque no maior gargalo declarado e em recomendações acionáveis nos próximos 90 dias.`;

    let analise: AnaliseEstruturada;
    let tokens_in = 0;
    let tokens_out = 0;
    let modeloUsado = PRIMARY_MODEL;
    let fallbackUsado = false;
    try {
      const result = await callAIWithFallback<AnaliseEstruturada>({
        apiKey: LOVABLE_API_KEY,
        primaryModel: PRIMARY_MODEL,
        fallbackModel: FALLBACK_MODEL,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        tool: TOOL_DEFINITION,
      });
      analise = result.data;
      tokens_in = result.tokens_in;
      tokens_out = result.tokens_out;
      modeloUsado = result.modelo_usado;
      fallbackUsado = result.fallback_usado;
    } catch (e) {
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
          JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (msg === "payment_required") {
        return new Response(
          JSON.stringify({ error: "Créditos de IA insuficientes. Adicione créditos no workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw e;
    }

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
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
