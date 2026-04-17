// Tabela de preços de modelos (USD por 1M tokens) — aproximação para auditoria.
export const PRICES_PER_1M: Record<string, { in: number; out: number }> = {
  "google/gemini-2.5-flash": { in: 0.075, out: 0.30 },
  "google/gemini-2.5-pro": { in: 1.25, out: 5.00 },
  "google/gemini-2.5-flash-lite": { in: 0.0375, out: 0.15 },
};

export function calcCustoUsd(model: string, tokensIn: number, tokensOut: number): number {
  const p = PRICES_PER_1M[model];
  if (!p) return 0;
  return (tokensIn / 1_000_000) * p.in + (tokensOut / 1_000_000) * p.out;
}
