// Edge function: process-diagnostico
// Gera análise estratégica PROFUNDA usando Gemini 2.5 Pro com reasoning high.
// Output estruturado: resumo narrativo, SWOT, 3 gargalos com causa-raiz,
// roadmap 90/180/365 dias, KPIs, riscos, e 8-12 recomendações detalhadas.

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

// Modelo principal: Gemini 2.5 Pro com raciocínio profundo.
// Fallback: GPT-5 (também forte em reasoning) sem reasoning explícito (modelo decide).
const PRIMARY_MODEL = "google/gemini-2.5-pro";
const FALLBACK_MODEL = "openai/gpt-5";
const FLAG_THRESHOLD = 0.6;

interface Recomendacao {
  numero: number;
  titulo: string;
  contexto: string;
  plano_acao: string[];
  kpi_sucesso: string;
  prazo: string;
  esforco: "baixo" | "medio" | "alto";
  impacto: "baixo" | "medio" | "alto";
  prioridade: "alta" | "media" | "baixa";
  categoria: string;
}

interface Gargalo {
  titulo: string;
  descricao: string;
  causa_raiz: string;
  impacto_no_negocio: string;
}

interface Marco {
  titulo: string;
  descricao: string;
  kpi: string;
}

interface KPI {
  nome: string;
  valor_atual_estimado: string;
  meta: string;
  como_medir: string;
}

interface Risco {
  titulo: string;
  probabilidade: "baixa" | "media" | "alta";
  impacto: "baixo" | "medio" | "alto";
  mitigacao: string;
}

interface AnaliseEstruturada {
  resumo_executivo: string;
  diagnostico_narrativo: string;
  score: number;
  classificacao_maturidade: string;
  confianca: number;
  swot: {
    forcas: string[];
    fraquezas: string[];
    oportunidades: string[];
    ameacas: string[];
  };
  gargalos_principais: Gargalo[];
  recomendacoes: Recomendacao[];
  roadmap: {
    dias_90: Marco[];
    dias_180: Marco[];
    dias_365: Marco[];
  };
  kpis_monitorar: KPI[];
  riscos: Risco[];
  proximo_passo_imediato: string;
}

const TOOL_DEFINITION = {
  name: "submit_diagnostico_completo",
  description:
    "Retorna a análise estratégica completa e estruturada do negócio do usuário.",
  parameters: {
    type: "object",
    properties: {
      resumo_executivo: {
        type: "string",
        description:
          "Resumo executivo de 2-3 parágrafos (mínimo 500 caracteres) com a tese central do diagnóstico — situação atual, principal alavanca e direção estratégica recomendada.",
      },
      diagnostico_narrativo: {
        type: "string",
        description:
          "Análise narrativa profunda de 4-6 parágrafos (mínimo 1500 caracteres). Deve interpretar o conjunto de respostas, conectar pontos entre métricas/estratégias/gargalos, identificar padrões, e explicar o 'porquê' por trás dos números. Linguagem de consultor sênior, específica para o caso.",
      },
      score: {
        type: "number",
        description: "Score de maturidade do negócio (0-100).",
      },
      classificacao_maturidade: {
        type: "string",
        description:
          "Texto curto que classifica o estágio: ex 'Negócio em estruturação inicial', 'Em desenvolvimento com tração', 'Estabelecido com gargalos de escala', 'Maduro pronto para expansão'.",
      },
      confianca: {
        type: "number",
        description:
          "Confiança da análise (0-1). Quanto mais respostas qualitativas detalhadas e contexto RAG relevante, maior.",
      },
      swot: {
        type: "object",
        properties: {
          forcas: {
            type: "array",
            items: { type: "string" },
            description: "3-5 forças concretas observadas (não genéricas).",
          },
          fraquezas: {
            type: "array",
            items: { type: "string" },
            description: "3-5 fraquezas concretas observadas.",
          },
          oportunidades: {
            type: "array",
            items: { type: "string" },
            description: "3-5 oportunidades específicas para este negócio.",
          },
          ameacas: {
            type: "array",
            items: { type: "string" },
            description: "3-5 ameaças reais (mercado, operacional, financeiro).",
          },
        },
        required: ["forcas", "fraquezas", "oportunidades", "ameacas"],
        additionalProperties: false,
      },
      gargalos_principais: {
        type: "array",
        description:
          "Exatamente 3 gargalos prioritários, ordenados por impacto. Cada um com causa-raiz (não sintoma).",
        items: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            descricao: { type: "string", description: "O que está acontecendo (sintoma observável)." },
            causa_raiz: {
              type: "string",
              description: "Por que isso acontece. Vai além do sintoma.",
            },
            impacto_no_negocio: {
              type: "string",
              description: "Custo de não resolver: financeiro, operacional, estratégico.",
            },
          },
          required: ["titulo", "descricao", "causa_raiz", "impacto_no_negocio"],
          additionalProperties: false,
        },
      },
      recomendacoes: {
        type: "array",
        description:
          "8 a 12 recomendações acionáveis, ordenadas por prioridade. Cada uma deve ser executável (não conselho genérico).",
        items: {
          type: "object",
          properties: {
            numero: { type: "number" },
            titulo: {
              type: "string",
              description: "Frase imperativa curta. Ex: 'Implementar funil de qualificação de leads em 30 dias'.",
            },
            contexto: {
              type: "string",
              description: "1-2 frases explicando POR QUE esta recomendação é relevante para este caso específico.",
            },
            plano_acao: {
              type: "array",
              items: { type: "string" },
              description: "3-6 passos sequenciais e concretos para executar.",
            },
            kpi_sucesso: {
              type: "string",
              description: "Métrica única que indica que a recomendação foi bem-sucedida.",
            },
            prazo: {
              type: "string",
              description: "Janela de execução. Ex: '30 dias', '60-90 dias'.",
            },
            esforco: { type: "string", enum: ["baixo", "medio", "alto"] },
            impacto: { type: "string", enum: ["baixo", "medio", "alto"] },
            prioridade: { type: "string", enum: ["alta", "media", "baixa"] },
            categoria: {
              type: "string",
              description: "Ex: aquisicao, conversao, retencao, operacional, financeiro, produto, time.",
            },
          },
          required: [
            "numero",
            "titulo",
            "contexto",
            "plano_acao",
            "kpi_sucesso",
            "prazo",
            "esforco",
            "impacto",
            "prioridade",
            "categoria",
          ],
          additionalProperties: false,
        },
      },
      roadmap: {
        type: "object",
        description:
          "Roadmap estratégico em 3 horizontes. Cada horizonte com 2-4 marcos concretos.",
        properties: {
          dias_90: {
            type: "array",
            items: {
              type: "object",
              properties: {
                titulo: { type: "string" },
                descricao: { type: "string" },
                kpi: { type: "string" },
              },
              required: ["titulo", "descricao", "kpi"],
              additionalProperties: false,
            },
          },
          dias_180: {
            type: "array",
            items: {
              type: "object",
              properties: {
                titulo: { type: "string" },
                descricao: { type: "string" },
                kpi: { type: "string" },
              },
              required: ["titulo", "descricao", "kpi"],
              additionalProperties: false,
            },
          },
          dias_365: {
            type: "array",
            items: {
              type: "object",
              properties: {
                titulo: { type: "string" },
                descricao: { type: "string" },
                kpi: { type: "string" },
              },
              required: ["titulo", "descricao", "kpi"],
              additionalProperties: false,
            },
          },
        },
        required: ["dias_90", "dias_180", "dias_365"],
        additionalProperties: false,
      },
      kpis_monitorar: {
        type: "array",
        description: "5-8 KPIs que o negócio deve monitorar continuamente.",
        items: {
          type: "object",
          properties: {
            nome: { type: "string" },
            valor_atual_estimado: {
              type: "string",
              description: "Estimativa baseada nas respostas, ou 'não informado'.",
            },
            meta: { type: "string", description: "Valor-alvo realista." },
            como_medir: { type: "string", description: "Fonte/ferramenta para medir." },
          },
          required: ["nome", "valor_atual_estimado", "meta", "como_medir"],
          additionalProperties: false,
        },
      },
      riscos: {
        type: "array",
        description: "3-5 riscos críticos identificados com plano de mitigação.",
        items: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            probabilidade: { type: "string", enum: ["baixa", "media", "alta"] },
            impacto: { type: "string", enum: ["baixo", "medio", "alto"] },
            mitigacao: { type: "string" },
          },
          required: ["titulo", "probabilidade", "impacto", "mitigacao"],
          additionalProperties: false,
        },
      },
      proximo_passo_imediato: {
        type: "string",
        description:
          "A ÚNICA coisa que o usuário deve fazer nas próximas 48h. Frase curta, imperativa e concreta.",
      },
    },
    required: [
      "resumo_executivo",
      "diagnostico_narrativo",
      "score",
      "classificacao_maturidade",
      "confianca",
      "swot",
      "gargalos_principais",
      "recomendacoes",
      "roadmap",
      "kpis_monitorar",
      "riscos",
      "proximo_passo_imediato",
    ],
    additionalProperties: false,
  },
};

const SYSTEM_PROMPT = `Você é um consultor estratégico SÊNIOR especializado em negócios digitais (infoprodutos, marketing digital, SaaS, consultoria). Você opera no nível de partner de uma boutique de consultoria como McKinsey/BCG aplicada ao mundo digital brasileiro.

Sua missão: produzir um diagnóstico ESTRATÉGICO PROFUNDO baseado nas respostas do usuário e no CONTEXTO de conhecimento verificado fornecido (RAG).

PRINCÍPIOS:
1. PROFUNDIDADE > BREVIDADE. Este relatório é um produto pago premium. O usuário espera análise densa, não bullets genéricos.
2. ESPECIFICIDADE. Toda observação deve referenciar dados concretos do usuário (ticket, faturamento, gargalo declarado, frustrações, tentativas falhas, etc). Cite números e respostas.
3. CAUSA-RAIZ. Para cada gargalo, vá além do sintoma — explique POR QUE acontece, não apenas O QUE acontece.
4. ACIONABILIDADE. Recomendações devem ter passo-a-passo executável por uma pessoa real nas próximas semanas. Nada de "melhore seu marketing".
5. NARRATIVA. O diagnóstico narrativo deve conectar pontos: como o gargalo principal se relaciona com as estratégias, frustrações, recursos, prazo e concorrência. Conte a história do negócio.
6. PRIORIZAÇÃO. Recomendações ordenadas por (impacto / esforço). Marque alta prioridade apenas para o que move o ponteiro nos próximos 90 dias.

REGRAS ANTI-ALUCINAÇÃO (CRÍTICAS):
- Use APENAS informações presentes nas respostas do usuário ou no CONTEXTO RAG.
- NÃO invente números, métricas, benchmarks ou citações que não estejam nos dados.
- Quando estimar (ex: KPI atual), marque explicitamente como "estimado a partir de [resposta X]" ou use "não informado".
- Se faltar informação crítica, recomende coleta de dados adicionais — não chute.

ESCALA DE SCORE (0-100):
- 0-30: estágio inicial, validação ainda em curso, processos informais.
- 30-60: em desenvolvimento, alguma tração, gargalos operacionais visíveis.
- 60-85: estabelecido, com receita previsível, pronto para profissionalização/escala.
- 85-100: maduro, expansão e otimização.

CONFIANÇA (0-1):
- 1.0: respostas qualitativas detalhadas + contexto RAG forte.
- 0.7-0.9: respostas suficientes, alguma RAG.
- 0.5-0.7: respostas incompletas ou pouca RAG.
- <0.5: dados insuficientes — sinalize o que falta no resumo.

VOLUME ESPERADO: o JSON final deve ter pelo menos 5000 caracteres de texto útil. Recomendações devem ter 3-6 passos cada.

Retorne SEMPRE via tool call estruturada.`;

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
    const { data: userData, error: userErr } =
      await supabaseAuth.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const diagnosticoId = body?.diagnostico_id as string | undefined;
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!diagnosticoId || !UUID_RE.test(diagnosticoId)) {
      return new Response(JSON.stringify({ error: "diagnostico_id inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: diag, error: diagErr } = await supabaseAdmin
      .from("diagnosticos")
      .select("id, user_id, respostas, segmento, empresa_nome, status")
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

    const userPrompt = `# DADOS DO NEGÓCIO

Empresa: ${diag.empresa_nome ?? "não informado"}
Segmento: ${diag.segmento ?? "não informado"}

# RESPOSTAS DO USUÁRIO (formulário de 6 etapas)
\`\`\`json
${JSON.stringify(respostas, null, 2)}
\`\`\`

# CONTEXTO DE CONHECIMENTO VERIFICADO (RAG)
${contextoTexto}

# TAREFA
Produza um diagnóstico estratégico PROFUNDO e DETALHADO, no nível de uma consultoria sênior. Conecte explicitamente as respostas qualitativas (ICP, frustração, tentativas falhas, recursos, prazo, concorrência) com as métricas quantitativas (faturamento, ticket, investimento, metas, gargalo). O usuário pagou por este relatório e espera profundidade real — vá fundo em causa-raiz, dê plano de ação executável e use linguagem específica para o caso dele, não conselhos genéricos.`;

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
        reasoningEffort: "high",
        fallbackReasoningEffort: "medium",
      });
      analise = result.data;
      tokens_in = result.tokens_in;
      tokens_out = result.tokens_out;
      modeloUsado = result.modelo_usado;
      fallbackUsado = result.fallback_usado;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("process-diagnostico AI error:", msg);
      await supabaseAdmin.from("operacoes_ia").insert({
        user_id: userId,
        diagnostico_id: diagnosticoId,
        tipo: "process_diagnostico",
        modelo: PRIMARY_MODEL,
        provider: "lovable_ai",
        sucesso: false,
        erro: msg.slice(0, 500),
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

    // Persistimos a análise completa em recomendacoes (jsonb) para preservar
    // toda a estrutura sem precisar de migração de schema. O resumo_executivo
    // continua como campo dedicado.
    const recomendacoesPayload = {
      diagnostico_narrativo: analise.diagnostico_narrativo,
      classificacao_maturidade: analise.classificacao_maturidade,
      swot: analise.swot,
      gargalos_principais: analise.gargalos_principais,
      recomendacoes: analise.recomendacoes,
      roadmap: analise.roadmap,
      kpis_monitorar: analise.kpis_monitorar,
      riscos: analise.riscos,
      proximo_passo_imediato: analise.proximo_passo_imediato,
    };

    const { error: updErr } = await supabaseAdmin
      .from("diagnosticos")
      .update({
        status: "concluido",
        resumo_executivo: analise.resumo_executivo,
        recomendacoes: recomendacoesPayload,
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
        gargalos_count: analise.gargalos_principais.length,
        rag_contexto_count: ragContexto.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("process-diagnostico error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
