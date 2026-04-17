// Cliente do Lovable AI Gateway com tool-call estruturado e fallback de modelo.
export interface AIToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AICallResult<T> {
  data: T;
  tokens_in: number;
  tokens_out: number;
}

export interface AICallWithFallbackResult<T> extends AICallResult<T> {
  modelo_usado: string;
  fallback_usado: boolean;
}

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export async function callAIOnce<T>(opts: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  tool: AIToolDefinition;
}): Promise<AICallResult<T>> {
  const { apiKey, model, systemPrompt, userPrompt, tool } = opts;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: tool.name } },
    }),
  });

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
  const data = JSON.parse(toolCall.function.arguments) as T;

  return {
    data,
    tokens_in: json.usage?.prompt_tokens ?? 0,
    tokens_out: json.usage?.completion_tokens ?? 0,
  };
}

export async function callAIWithFallback<T>(opts: {
  apiKey: string;
  primaryModel: string;
  fallbackModel: string;
  systemPrompt: string;
  userPrompt: string;
  tool: AIToolDefinition;
}): Promise<AICallWithFallbackResult<T>> {
  const { apiKey, primaryModel, fallbackModel, systemPrompt, userPrompt, tool } = opts;
  try {
    const r = await callAIOnce<T>({ apiKey, model: primaryModel, systemPrompt, userPrompt, tool });
    return { ...r, modelo_usado: primaryModel, fallback_usado: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const retriable = msg === "rate_limit" || msg.startsWith("upstream_5");
    if (!retriable) throw e;
    console.warn(`Primary model ${primaryModel} falhou (${msg}); tentando fallback ${fallbackModel}`);
    const r = await callAIOnce<T>({ apiKey, model: fallbackModel, systemPrompt, userPrompt, tool });
    return { ...r, modelo_usado: fallbackModel, fallback_usado: true };
  }
}
