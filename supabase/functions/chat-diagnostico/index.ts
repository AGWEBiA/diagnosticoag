// Chat IA contextual para um diagnóstico específico.
// Recebe diagnostico_id + mensagens, valida acesso (dono ou admin),
// roda RAG, chama Lovable AI em streaming e persiste interações.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { generateEmbedding } from "../_shared/embeddings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface Payload {
  diagnostico_id: string;
  messages: ChatMsg[];
}

function validate(p: unknown): Payload {
  if (!p || typeof p !== "object") throw new Error("Payload inválido");
  const o = p as Record<string, unknown>;
  const diagnostico_id = typeof o.diagnostico_id === "string" ? o.diagnostico_id.trim() : "";
  if (!/^[0-9a-f-]{36}$/i.test(diagnostico_id)) throw new Error("diagnostico_id inválido");

  if (!Array.isArray(o.messages) || o.messages.length === 0) {
    throw new Error("messages é obrigatório");
  }
  if (o.messages.length > 50) throw new Error("Histórico muito longo");

  const messages: ChatMsg[] = [];
  for (const m of o.messages as Array<Record<string, unknown>>) {
    const role = m.role === "user" || m.role === "assistant" ? m.role : null;
    const content = typeof m.content === "string" ? m.content : "";
    if (!role || !content || content.length > 8000) {
      throw new Error("Mensagem inválida");
    }
    messages.push({ role, content });
  }
  if (messages[messages.length - 1].role !== "user") {
    throw new Error("Última mensagem deve ser do usuário");
  }
  return { diagnostico_id, messages };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    let payload: Payload;
    try {
      payload = validate(await req.json());
    } catch (e) {
      return new Response(
        JSON.stringify({ error: e instanceof Error ? e.message : "Payload inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verifica acesso: dono ou admin
    const [{ data: diag, error: diagErr }, { data: adminRole }] = await Promise.all([
      adminClient
        .from("diagnosticos")
        .select("id, user_id, empresa_nome, segmento, status, score, resumo_executivo, recomendacoes, respostas")
        .eq("id", payload.diagnostico_id)
        .maybeSingle(),
      adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle(),
    ]);

    if (diagErr || !diag) {
      return new Response(JSON.stringify({ error: "Diagnóstico não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const isAdmin = !!adminRole;
    if (diag.user_id !== userId && !isAdmin) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startedAt = Date.now();
    const lastUser = payload.messages[payload.messages.length - 1].content;

    // RAG: busca trechos da knowledge_base relevantes para a última pergunta
    let ragMatches: Array<{ titulo: string; conteudo: string; categoria: string | null; fonte: string | null; similarity: number }> = [];
    try {
      const emb = await generateEmbedding(lastUser);
      const { data: matches } = await adminClient.rpc("match_knowledge", {
        query_embedding: emb.embedding as unknown as string,
        match_threshold: 0.5,
        match_count: 4,
      });
      if (Array.isArray(matches)) ragMatches = matches as typeof ragMatches;
    } catch (e) {
      console.warn("chat-diagnostico: RAG falhou, seguindo sem contexto extra", e);
    }

    // Persiste mensagem do usuário (com user_id sendo o caller, não o dono do diagnostico)
    await adminClient.from("interacoes_chat").insert({
      diagnostico_id: payload.diagnostico_id,
      user_id: userId,
      role: "user",
      content: lastUser,
    });

    const recos = Array.isArray(diag.recomendacoes) ? diag.recomendacoes : [];
    const ragBlock = ragMatches.length
      ? ragMatches
          .map(
            (m, i) =>
              `[${i + 1}] ${m.titulo}${m.fonte ? ` (fonte: ${m.fonte})` : ""}\n${m.conteudo}`
          )
          .join("\n\n")
      : "(nenhum trecho relevante encontrado)";

    const systemPrompt = `Você é um consultor sênior em negócios digitais analisando um diagnóstico específico.

REGRAS ANTI-ALUCINAÇÃO:
- Use APENAS dados do diagnóstico abaixo e dos trechos da base de conhecimento (RAG).
- Se a informação não estiver disponível, diga claramente "não tenho essa informação no diagnóstico".
- Sempre que citar uma recomendação ou conhecimento, seja específico.
- Responda em português, tom consultivo, claro e objetivo. Use markdown.

DIAGNÓSTICO:
- Empresa: ${diag.empresa_nome ?? "(não informado)"}
- Segmento: ${diag.segmento ?? "(não informado)"}
- Status: ${diag.status}
- Score de maturidade: ${diag.score ?? "n/d"}
- Resumo executivo: ${diag.resumo_executivo ?? "(ainda não gerado)"}

RECOMENDAÇÕES JÁ GERADAS:
${
  recos.length
    ? (recos as Array<{ titulo?: string; descricao?: string; impacto?: string; prioridade?: number }>)
        .map(
          (r, i) =>
            `${r.prioridade ?? i + 1}. ${r.titulo ?? "(sem título)"}${r.impacto ? ` [${r.impacto}]` : ""}${
              r.descricao ? ` — ${r.descricao}` : ""
            }`
        )
        .join("\n")
    : "(nenhuma)"
}

RESPOSTAS DO DIAGNÓSTICO (JSON):
${JSON.stringify(diag.respostas).slice(0, 4000)}

CONTEXTO RAG (base de conhecimento aprovada):
${ragBlock}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...payload.messages],
        stream: true,
      }),
    });

    if (!aiResp.ok || !aiResp.body) {
      const errText = await aiResp.text().catch(() => "");
      console.error("chat-diagnostico: AI gateway error", aiResp.status, errText);

      await adminClient.from("operacoes_ia").insert({
        user_id: userId,
        diagnostico_id: payload.diagnostico_id,
        tipo: "chat_diagnostico",
        provider: "lovable",
        modelo: "google/gemini-2.5-flash",
        sucesso: false,
        erro: `${aiResp.status}: ${errText.slice(0, 500)}`,
        duracao_ms: Date.now() - startedAt,
      });

      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados. Adicione fundos no workspace Lovable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ error: "Falha na IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Faz proxy do stream e acumula a resposta para persistir + auditar
    let fullText = "";
    let tokensIn: number | null = null;
    let tokensOut: number | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiResp.body!.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            controller.enqueue(value);

            // Tenta extrair texto e usage do stream para persistir depois
            let nl: number;
            while ((nl = buffer.indexOf("\n")) !== -1) {
              const line = buffer.slice(0, nl).replace(/\r$/, "");
              buffer = buffer.slice(nl + 1);
              if (!line.startsWith("data: ")) continue;
              const j = line.slice(6).trim();
              if (j === "[DONE]") continue;
              try {
                const parsed = JSON.parse(j);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (typeof delta === "string") fullText += delta;
                if (parsed.usage) {
                  tokensIn = parsed.usage.prompt_tokens ?? tokensIn;
                  tokensOut = parsed.usage.completion_tokens ?? tokensOut;
                }
              } catch {
                // ignora linhas parciais
              }
            }
          }
        } catch (err) {
          console.error("chat-diagnostico: stream error", err);
        } finally {
          controller.close();

          // Persiste resposta + auditoria após o término
          try {
            await adminClient.from("interacoes_chat").insert({
              diagnostico_id: payload.diagnostico_id,
              user_id: userId,
              role: "assistant",
              content: fullText,
              modelo: "google/gemini-2.5-flash",
              rag_contexto: ragMatches.length ? { matches: ragMatches } : null,
              tokens_input: tokensIn,
              tokens_output: tokensOut,
            });

            await adminClient.from("operacoes_ia").insert({
              user_id: userId,
              diagnostico_id: payload.diagnostico_id,
              tipo: "chat_diagnostico",
              provider: "lovable",
              modelo: "google/gemini-2.5-flash",
              tokens_input: tokensIn,
              tokens_output: tokensOut,
              duracao_ms: Date.now() - startedAt,
              sucesso: true,
            });

            await adminClient.from("audit_trail_ia").insert({
              user_id: userId,
              diagnostico_id: payload.diagnostico_id,
              modelo: "google/gemini-2.5-flash",
              prompt: lastUser.slice(0, 4000),
              resposta: fullText.slice(0, 8000),
              contexto_rag: ragMatches.length ? { matches: ragMatches.map((m) => ({ titulo: m.titulo, similarity: m.similarity })) } : null,
            });
          } catch (e) {
            console.error("chat-diagnostico: persistence failed", e);
          }
          // dispatch encoder para evitar warning de import não usado
          void encoder;
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-diagnostico: unexpected", e);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
