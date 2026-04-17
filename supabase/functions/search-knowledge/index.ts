// Semantic search over the knowledge base.
// Any authenticated user can call it; only approved knowledge is returned (RPC enforces).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { generateEmbedding } from "../_shared/embeddings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SearchPayload {
  query: string;
  threshold?: number;
  count?: number;
}

function validate(payload: unknown): SearchPayload {
  if (!payload || typeof payload !== "object") throw new Error("Payload inválido");
  const p = payload as Record<string, unknown>;
  const query = typeof p.query === "string" ? p.query.trim() : "";
  if (!query || query.length > 4000) throw new Error("query é obrigatória (1-4000 chars)");

  let threshold = typeof p.threshold === "number" ? p.threshold : 0.5;
  if (threshold < 0) threshold = 0;
  if (threshold > 1) threshold = 1;

  let count = typeof p.count === "number" ? Math.floor(p.count) : 5;
  if (count < 1) count = 1;
  if (count > 20) count = 20;

  return { query, threshold, count };
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

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    let payload: SearchPayload;
    try {
      payload = validate(await req.json());
    } catch (e) {
      return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Payload inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startedAt = Date.now();
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate query embedding
    let embeddingResult;
    try {
      embeddingResult = await generateEmbedding(payload.query);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao gerar embedding";
      console.error("search-knowledge: embedding failed", msg);

      await adminClient.from("operacoes_ia").insert({
        user_id: userId,
        tipo: "embedding_search",
        sucesso: false,
        erro: msg,
        duracao_ms: Date.now() - startedAt,
      });

      return new Response(JSON.stringify({ error: msg }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Run semantic search via RPC
    const { data: matches, error: matchError } = await adminClient.rpc("match_knowledge", {
      query_embedding: embeddingResult.embedding as unknown as string,
      match_threshold: payload.threshold,
      match_count: payload.count,
    });

    if (matchError) {
      console.error("search-knowledge: rpc failed", matchError);
      return new Response(JSON.stringify({ error: "Falha na busca semântica" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log success
    await adminClient.from("operacoes_ia").insert({
      user_id: userId,
      tipo: "embedding_search",
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
        matches: matches ?? [],
        provider: embeddingResult.provider,
        model: embeddingResult.model,
        threshold: payload.threshold,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("search-knowledge: unexpected", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro inesperado" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
