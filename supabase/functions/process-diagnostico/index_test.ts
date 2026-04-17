// Testes unitários para os módulos shared usados em process-diagnostico.
// Executar: deno test --allow-net --allow-env supabase/functions/process-diagnostico/

import {
  assertEquals,
  assertAlmostEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { calcCustoUsd, PRICES_PER_1M } from "../_shared/pricing.ts";
import {
  buildQueryFromRespostas,
  formatRagContext,
  type RagItem,
} from "../_shared/rag.ts";
import { callAIWithFallback } from "../_shared/ai-client.ts";

// ---------- pricing ----------

Deno.test("pricing: calcCustoUsd modelo primário (gemini-2.5-flash)", () => {
  // 1M in + 1M out
  const c = calcCustoUsd("google/gemini-2.5-flash", 1_000_000, 1_000_000);
  const expected = PRICES_PER_1M["google/gemini-2.5-flash"].in + PRICES_PER_1M["google/gemini-2.5-flash"].out;
  assertAlmostEquals(c, expected, 1e-9);
});

Deno.test("pricing: calcCustoUsd valores parciais", () => {
  // 500k in, 250k out no flash: 0.5 * 0.075 + 0.25 * 0.30
  const c = calcCustoUsd("google/gemini-2.5-flash", 500_000, 250_000);
  assertAlmostEquals(c, 0.5 * 0.075 + 0.25 * 0.30, 1e-9);
});

Deno.test("pricing: modelo desconhecido devolve 0", () => {
  assertEquals(calcCustoUsd("inexistente/modelo", 10_000, 10_000), 0);
});

Deno.test("pricing: fallback (gemini-2.5-pro) é mais caro que primário", () => {
  const flash = calcCustoUsd("google/gemini-2.5-flash", 100_000, 100_000);
  const pro = calcCustoUsd("google/gemini-2.5-pro", 100_000, 100_000);
  if (!(pro > flash)) {
    throw new Error(`Esperado pro > flash, recebido pro=${pro} flash=${flash}`);
  }
});

// ---------- rag helpers ----------

Deno.test("rag: buildQueryFromRespostas com campos completos", () => {
  const q = buildQueryFromRespostas({
    segmento: "infoprodutor",
    faturamento_mensal: "10000",
    maior_gargalo: "tráfego",
    estrategia_maior_retorno: "anuncios",
    estrategia_menor_retorno: "organico",
  });
  if (!q.includes("Segmento: infoprodutor")) throw new Error("falta segmento");
  if (!q.includes("Gargalo: tráfego")) throw new Error("falta gargalo");
});

Deno.test("rag: buildQueryFromRespostas vazio retorna fallback", () => {
  assertEquals(
    buildQueryFromRespostas({}),
    "diagnóstico de negócio digital",
  );
});

Deno.test("rag: formatRagContext vazio", () => {
  assertEquals(formatRagContext([]), "(nenhum contexto adicional disponível)");
});

Deno.test("rag: formatRagContext numerado", () => {
  const items: RagItem[] = [
    { titulo: "T1", conteudo: "C1", categoria: "vendas", similarity: 0.9 },
    { titulo: "T2", conteudo: "C2", categoria: null, similarity: 0.8 },
  ];
  const out = formatRagContext(items);
  if (!out.startsWith("[1] (vendas) T1")) throw new Error("formato incorreto");
  if (!out.includes("[2] (geral) T2")) throw new Error("fallback de categoria falhou");
});

// ---------- ai-client (com fetch mockado) ----------

function mockFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const original = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(handler(String(input), init ?? {}))) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

function aiOkResponse(args: Record<string, unknown>, tokens = { in: 100, out: 50 }) {
  return new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            tool_calls: [
              { function: { name: "submit_diagnostico", arguments: JSON.stringify(args) } },
            ],
          },
        },
      ],
      usage: { prompt_tokens: tokens.in, completion_tokens: tokens.out },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

const TOOL = {
  name: "submit_diagnostico",
  description: "x",
  parameters: { type: "object", properties: {} },
};

Deno.test("ai-client: sucesso no modelo primário, sem fallback", async () => {
  const restore = mockFetch(() =>
    aiOkResponse({ resumo_executivo: "ok", score: 70, confianca: 0.9, recomendacoes: [] })
  );
  try {
    const r = await callAIWithFallback({
      apiKey: "test",
      primaryModel: "google/gemini-2.5-flash",
      fallbackModel: "google/gemini-2.5-pro",
      systemPrompt: "s",
      userPrompt: "u",
      tool: TOOL,
    });
    assertEquals(r.modelo_usado, "google/gemini-2.5-flash");
    assertEquals(r.fallback_usado, false);
    assertEquals(r.tokens_in, 100);
    assertEquals(r.tokens_out, 50);
  } finally {
    restore();
  }
});

Deno.test("ai-client: rate_limit no primário aciona fallback", async () => {
  let calls = 0;
  const restore = mockFetch((_url, init) => {
    calls++;
    const body = JSON.parse(String(init.body));
    if (body.model === "google/gemini-2.5-flash") {
      return new Response("rate", { status: 429 });
    }
    return aiOkResponse(
      { resumo_executivo: "fb", score: 60, confianca: 0.7, recomendacoes: [] },
      { in: 200, out: 100 },
    );
  });
  try {
    const r = await callAIWithFallback({
      apiKey: "test",
      primaryModel: "google/gemini-2.5-flash",
      fallbackModel: "google/gemini-2.5-pro",
      systemPrompt: "s",
      userPrompt: "u",
      tool: TOOL,
    });
    assertEquals(calls, 2);
    assertEquals(r.modelo_usado, "google/gemini-2.5-pro");
    assertEquals(r.fallback_usado, true);
  } finally {
    restore();
  }
});

Deno.test("ai-client: payment_required NÃO aciona fallback (não retriable)", async () => {
  const restore = mockFetch(() => new Response("no credits", { status: 402 }));
  try {
    await assertRejects(
      () =>
        callAIWithFallback({
          apiKey: "test",
          primaryModel: "google/gemini-2.5-flash",
          fallbackModel: "google/gemini-2.5-pro",
          systemPrompt: "s",
          userPrompt: "u",
          tool: TOOL,
        }),
      Error,
      "payment_required",
    );
  } finally {
    restore();
  }
});

Deno.test("ai-client: 5xx aciona fallback", async () => {
  let calls = 0;
  const restore = mockFetch((_url, init) => {
    calls++;
    const body = JSON.parse(String(init.body));
    if (body.model === "google/gemini-2.5-flash") {
      return new Response("oops", { status: 503 });
    }
    return aiOkResponse({ resumo_executivo: "ok", score: 50, confianca: 0.65, recomendacoes: [] });
  });
  try {
    const r = await callAIWithFallback({
      apiKey: "test",
      primaryModel: "google/gemini-2.5-flash",
      fallbackModel: "google/gemini-2.5-pro",
      systemPrompt: "s",
      userPrompt: "u",
      tool: TOOL,
    });
    assertEquals(calls, 2);
    assertEquals(r.fallback_usado, true);
  } finally {
    restore();
  }
});

// ---------- regra de auto-flag (replicada para garantir threshold) ----------

const FLAG_THRESHOLD = 0.6;
function deveFlagar(confianca: number, fallbackUsado: boolean): boolean {
  return confianca < FLAG_THRESHOLD || fallbackUsado;
}

Deno.test("auto-flag: confiança 0.4 deve flagar", () => {
  assertEquals(deveFlagar(0.4, false), true);
});

Deno.test("auto-flag: confiança 0.9 sem fallback NÃO flaga", () => {
  assertEquals(deveFlagar(0.9, false), false);
});

Deno.test("auto-flag: confiança alta + fallback flaga", () => {
  assertEquals(deveFlagar(0.9, true), true);
});
