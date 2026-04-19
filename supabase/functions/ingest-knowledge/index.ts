// Ingest a piece of knowledge: generate embedding and persist to knowledge_base.
// Admin-only.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { generateEmbedding } from "../_shared/embeddings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface IngestPayload {
  titulo: string;
  conteudo: string;
  categoria?: string | null;
  tags?: string[] | null;
  fonte?: string | null;
  status?: "pendente" | "aprovado" | "rejeitado";
}

function validate(payload: unknown): IngestPayload {
  if (!payload || typeof payload !== "object") throw new Error("Payload inválido");
  const p = payload as Record<string, unknown>;
  const titulo = typeof p.titulo === "string" ? p.titulo.trim() : "";
  const conteudo = typeof p.conteudo === "string" ? p.conteudo.trim() : "";
  if (!titulo || titulo.length > 500) throw new Error("titulo é obrigatório (1-500 chars)");
  if (!conteudo || conteudo.length > 50000) throw new Error("conteudo é obrigatório (1-50000 chars)");

  return {
    titulo,
    conteudo,
    categoria: typeof p.categoria === "string" ? p.categoria.slice(0, 100) : null,
    tags: Array.isArray(p.tags) ? p.tags.filter((t) => typeof t === "string").slice(0, 20) as string[] : null,
    fonte: typeof p.fonte === "string" ? p.fonte.slice(0, 500) : null,
    status: p.status === "aprovado" || p.status === "rejeitado" ? p.status : "pendente",
  };
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

    // Validate user via JWT
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

    // Admin check via service role (bypasses RLS, reads only this user's roles)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleData, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      console.error("ingest-knowledge: role lookup failed", roleError);
      return new Response(JSON.stringify({ error: "Falha ao verificar permissões" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Apenas admins podem ingerir conhecimento" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate input
    let payload: IngestPayload;
    try {
      payload = validate(await req.json());
    } catch (e) {
      return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Payload inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate embedding from titulo + conteudo
    const startedAt = Date.now();
    const textToEmbed = `${payload.titulo}\n\n${payload.conteudo}`;
    let embeddingResult;
    try {
      embeddingResult = await generateEmbedding(textToEmbed);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao gerar embedding";
      console.error("ingest-knowledge: embedding failed", msg);

      // Log failure
      await adminClient.from("operacoes_ia").insert({
        user_id: userId,
        tipo: "embedding_ingest",
        sucesso: false,
        erro: msg,
        duracao_ms: Date.now() - startedAt,
      });

      return new Response(JSON.stringify({ error: msg }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert knowledge row
    const { data: inserted, error: insertError } = await adminClient
      .from("knowledge_base")
      .insert({
        titulo: payload.titulo,
        conteudo: payload.conteudo,
        categoria: payload.categoria,
        tags: payload.tags ?? [],
        fonte: payload.fonte,
        status: payload.status,
        created_by: userId,
        embedding: embeddingResult.embedding as unknown as string,
      })
      .select("id, titulo, status, created_at")
      .single();

    if (insertError) {
      console.error("ingest-knowledge: insert failed", insertError);
      return new Response(JSON.stringify({ error: "Falha ao salvar conhecimento" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log success
    await adminClient.from("operacoes_ia").insert({
      user_id: userId,
      tipo: "embedding_ingest",
      provider: embeddingResult.provider,
      modelo: embeddingResult.model,
      tokens_input: embeddingResult.tokensInput,
      tokens_output: 0,
      duracao_ms: Date.now() - startedAt,
      sucesso: true,
    });

    return new Response(
      JSON.stringify({
        success: true,
        knowledge: inserted,
        provider: embeddingResult.provider,
        model: embeddingResult.model,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("ingest-knowledge: unexpected", e);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
