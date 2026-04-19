// Gera PDF profissional do diagnóstico em layout híbrido:
// - Capa escura com gradient verde-esmeralda (logo + empresa + score + data)
// - Miolo claro com sumário, score, SWOT 2x2, gargalos, recomendações,
//   roadmap timeline, KPIs e riscos.
// Salva no bucket privado `relatorios` e registra metadados em `relatorios_pdf`.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Payload {
  diagnostico_id: string;
}

function validate(p: unknown): Payload {
  if (!p || typeof p !== "object") throw new Error("Payload inválido");
  const o = p as Record<string, unknown>;
  const diagnostico_id =
    typeof o.diagnostico_id === "string" ? o.diagnostico_id.trim() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(diagnostico_id))
    throw new Error("diagnostico_id inválido");
  return { diagnostico_id };
}

function safe(s: unknown, fallback = "—"): string {
  if (s === null || s === undefined) return fallback;
  const t = String(s).trim();
  return t.length ? t : fallback;
}

// =====================================================
// Paleta semântica (HSL convertido p/ RGB para jsPDF)
// =====================================================
const C = {
  // Capa
  darkBg: [10, 18, 14] as [number, number, number],
  darkBgGradient: [12, 30, 22] as [number, number, number],
  emerald: [16, 185, 129] as [number, number, number],
  emeraldGlow: [52, 211, 153] as [number, number, number],
  // Miolo
  bg: [255, 255, 255] as [number, number, number],
  surface: [248, 250, 249] as [number, number, number],
  border: [228, 232, 230] as [number, number, number],
  borderStrong: [200, 208, 204] as [number, number, number],
  text: [20, 28, 24] as [number, number, number],
  textMuted: [100, 110, 105] as [number, number, number],
  textSubtle: [140, 150, 145] as [number, number, number],
  // Estados
  success: [16, 185, 129] as [number, number, number],
  warning: [234, 179, 8] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  info: [59, 130, 246] as [number, number, number],
  // SWOT
  swotForcas: [220, 252, 231] as [number, number, number],
  swotForcasBorder: [16, 185, 129] as [number, number, number],
  swotFraquezas: [254, 226, 226] as [number, number, number],
  swotFraquezasBorder: [239, 68, 68] as [number, number, number],
  swotOportunidades: [219, 234, 254] as [number, number, number],
  swotOportunidadesBorder: [59, 130, 246] as [number, number, number],
  swotAmeacas: [254, 240, 199] as [number, number, number],
  swotAmeacasBorder: [234, 179, 8] as [number, number, number],
};

interface Recomendacao {
  numero?: number;
  titulo?: string;
  contexto?: string;
  plano_acao?: string[];
  kpi_sucesso?: string;
  prazo?: string;
  esforco?: "baixo" | "medio" | "alto";
  impacto?: "baixo" | "medio" | "alto";
  prioridade?: "alta" | "media" | "baixa";
  categoria?: string;
}

interface Gargalo {
  titulo?: string;
  descricao?: string;
  causa_raiz?: string;
  impacto_no_negocio?: string;
}

interface Marco {
  titulo?: string;
  descricao?: string;
  kpi?: string;
}

interface KPI {
  nome?: string;
  valor_atual_estimado?: string;
  meta?: string;
  como_medir?: string;
}

interface Risco {
  titulo?: string;
  probabilidade?: "baixa" | "media" | "alta";
  impacto?: "baixo" | "medio" | "alto";
  mitigacao?: string;
}

interface AnalisePayload {
  diagnostico_narrativo?: string;
  classificacao_maturidade?: string;
  swot?: {
    forcas?: string[];
    fraquezas?: string[];
    oportunidades?: string[];
    ameacas?: string[];
  };
  gargalos_principais?: Gargalo[];
  recomendacoes?: Recomendacao[];
  roadmap?: {
    dias_90?: Marco[];
    dias_180?: Marco[];
    dias_365?: Marco[];
  };
  kpis_monitorar?: KPI[];
  riscos?: Risco[];
  proximo_passo_imediato?: string;
}

interface DiagDataPdf {
  empresa_nome: string | null;
  segmento: string | null;
  status: string;
  score: number | null;
  resumo_executivo: string | null;
  recomendacoes: unknown; // jsonb com payload completo
  respostas: unknown;
  created_at: string;
  concluido_em: string | null;
}

// =====================================================
// Builder principal
// =====================================================
function buildPdf(diag: DiagDataPdf): Uint8Array {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;

  // Extrai payload estruturado (com fallback se o diagnóstico for legado)
  const payload: AnalisePayload =
    diag.recomendacoes && typeof diag.recomendacoes === "object" && !Array.isArray(diag.recomendacoes)
      ? (diag.recomendacoes as AnalisePayload)
      : {};
  // Compat: diagnósticos antigos salvavam recomendacoes como array
  const legacyRecos: Recomendacao[] | null =
    Array.isArray(diag.recomendacoes) ? (diag.recomendacoes as Recomendacao[]) : null;
  const recomendacoes: Recomendacao[] = payload.recomendacoes ?? legacyRecos ?? [];

  // -----------------------------------------------
  // CAPA (página 1) — escura com gradient verde
  // -----------------------------------------------
  drawCover(doc, pageW, pageH, diag);

  // -----------------------------------------------
  // SUMÁRIO (página 2) — placeholder; preenchido no final
  // -----------------------------------------------
  doc.addPage();

  // -----------------------------------------------
  // MIOLO claro a partir da página 3
  // -----------------------------------------------
  doc.addPage();
  let y = margin + 20;

  // Quebra de página inteligente:
  // - Se o conteúdo cabe na página atual, desenha aqui.
  // - Se NÃO cabe na página atual MAS cabe inteiro em uma página nova, quebra.
  // - Se for maior que uma página inteira (raro: card gigante), começa na atual
  //   e deixa o desenho fluir (single-card overflow é melhor que página vazia).
  const usableH = pageH - margin - 30 - (margin + 20);
  const ensureSpace = (needed: number) => {
    const remaining = pageH - margin - 30 - y;
    if (needed <= remaining) return; // cabe aqui
    if (needed <= usableH) {
      // não cabe aqui mas cabe em página nova — quebra
      doc.addPage();
      y = margin + 20;
    }
    // se needed > usableH, deixa fluir na atual (card gigante)
  };

  // Coleta entradas do sumário: { label, page, y } — atualizado em cada sectionTitle
  interface TocEntry { label: string; page: number; y: number }
  const toc: TocEntry[] = [];
  const recordToc = (label: string) => {
    toc.push({ label, page: doc.getCurrentPageInfo().pageNumber, y });
  };

  // ---------- 1. PRÓXIMO PASSO IMEDIATO (callout no topo) ----------
  if (payload.proximo_passo_imediato) {
    sectionEyebrow(doc, "ATENÇÃO IMEDIATA", margin, y);
    y += 14;
    y = drawCallout(
      doc,
      payload.proximo_passo_imediato,
      "Próximo passo (próximas 48h)",
      margin,
      y,
      contentW,
      C.emerald,
    );
    y += 16;
  }

  // ---------- 2. SCORE + CLASSIFICAÇÃO ----------
  ensureSpace(120);
  recordToc("Maturidade do negócio");
  sectionEyebrow(doc, "MATURIDADE DO NEGÓCIO", margin, y);
  y += 14;
  y = drawScorePanel(
    doc,
    diag.score ?? 0,
    payload.classificacao_maturidade ?? classificarScore(diag.score ?? 0),
    margin,
    y,
    contentW,
  );
  y += 20;

  // ---------- 3. RESUMO EXECUTIVO ----------
  ensureSpace(100);
  recordToc("Resumo executivo");
  sectionTitle(doc, "Resumo executivo", margin, y);
  y += 24;
  y = paragraph(
    doc,
    diag.resumo_executivo?.trim() || "Resumo executivo não gerado.",
    margin,
    y,
    contentW,
    { size: 10.5, lineHeight: 14 },
    ensureSpace,
  );
  y += 16;

  // ---------- 4. DIAGNÓSTICO NARRATIVO ----------
  if (payload.diagnostico_narrativo) {
    ensureSpace(100);
    recordToc("Análise estratégica");
    sectionTitle(doc, "Análise estratégica", margin, y);
    y += 24;
    y = paragraph(
      doc,
      payload.diagnostico_narrativo,
      margin,
      y,
      contentW,
      { size: 10.5, lineHeight: 14 },
      ensureSpace,
    );
    y += 16;
  }

  // ---------- 5. SWOT (2x2) ----------
  if (payload.swot) {
    ensureSpace(40);
    recordToc("Análise SWOT");
    sectionTitle(doc, "Análise SWOT", margin, y);
    y += 24;
    y = drawSwot(doc, payload.swot, margin, y, contentW, ensureSpace);
    y += 16;
  }

  // ---------- 6. GARGALOS PRINCIPAIS ----------
  if (payload.gargalos_principais && payload.gargalos_principais.length > 0) {
    ensureSpace(60);
    recordToc("Gargalos principais");
    sectionTitle(doc, "Gargalos principais (causa-raiz)", margin, y);
    y += 24;
    payload.gargalos_principais.forEach((g, i) => {
      y = drawGargalo(doc, g, i + 1, margin, y, contentW, ensureSpace);
      y += 10;
    });
    y += 8;
  }

  // ---------- 7. RECOMENDAÇÕES ----------
  if (recomendacoes.length > 0) {
    ensureSpace(60);
    recordToc(`Recomendações (${recomendacoes.length})`);
    sectionTitle(doc, `Recomendações priorizadas (${recomendacoes.length})`, margin, y);
    y += 24;
    recomendacoes.forEach((r, i) => {
      y = drawRecomendacao(doc, r, i + 1, margin, y, contentW, ensureSpace);
      y += 12;
    });
  }

  // ---------- 8. ROADMAP TIMELINE ----------
  if (payload.roadmap) {
    ensureSpace(80);
    recordToc("Roadmap estratégico");
    sectionTitle(doc, "Roadmap estratégico", margin, y);
    y += 24;
    y = drawRoadmap(doc, payload.roadmap, margin, y, contentW, ensureSpace);
    y += 16;
  }

  // ---------- 9. KPIs ----------
  if (payload.kpis_monitorar && payload.kpis_monitorar.length > 0) {
    ensureSpace(80);
    recordToc("KPIs para monitorar");
    sectionTitle(doc, "KPIs para monitorar", margin, y);
    y += 24;
    y = drawKpisTable(doc, payload.kpis_monitorar, margin, y, contentW, ensureSpace);
    y += 16;
  }

  // ---------- 10. RISCOS ----------
  if (payload.riscos && payload.riscos.length > 0) {
    ensureSpace(80);
    recordToc("Riscos & mitigação");
    sectionTitle(doc, "Riscos & mitigação", margin, y);
    y += 24;
    payload.riscos.forEach((r) => {
      y = drawRisco(doc, r, margin, y, contentW, ensureSpace);
      y += 8;
    });
  }

  // -----------------------------------------------
  // SUMÁRIO: voltar para página 2 e preencher
  // -----------------------------------------------
  doc.setPage(2);
  drawSumario(doc, pageW, pageH, margin, contentW, toc, diag.empresa_nome ?? "Diagnóstico");

  // -----------------------------------------------
  // Header/footer em todas as páginas (exceto capa)
  // -----------------------------------------------
  const pageCount = doc.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    drawHeader(doc, pageW, margin, diag.empresa_nome ?? "Diagnóstico");
    drawFooter(doc, pageW, pageH, margin, i - 1, pageCount - 1);
  }

  const ab = doc.output("arraybuffer");
  return new Uint8Array(ab);
}

// =====================================================
// CAPA
// =====================================================
function drawCover(
  doc: jsPDF,
  pageW: number,
  pageH: number,
  diag: DiagDataPdf,
) {
  // Reset character spacing logo no início da capa para garantir que
  // chamadas anteriores não influenciem o kerning do título.
  doc.setCharSpace(0);

  // Fundo escuro
  doc.setFillColor(C.darkBg[0], C.darkBg[1], C.darkBg[2]);
  doc.rect(0, 0, pageW, pageH, "F");

  // "Gradient" simulado: faixas sobrepostas no canto inferior esquerdo
  for (let i = 0; i < 60; i++) {
    const alpha = 1 - i / 60;
    const r = Math.round(C.darkBg[0] + (C.darkBgGradient[0] - C.darkBg[0]) * alpha);
    const g = Math.round(C.darkBg[1] + (C.darkBgGradient[1] - C.darkBg[1]) * alpha);
    const b = Math.round(C.darkBg[2] + (C.darkBgGradient[2] - C.darkBg[2]) * alpha);
    doc.setFillColor(r, g, b);
    doc.rect(0, pageH - 280 + i * 4, pageW, 6, "F");
  }

  // Glow verde no canto superior direito (círculos concêntricos)
  for (let i = 0; i < 12; i++) {
    const radius = 180 - i * 12;
    const opacity = 0.08;
    doc.setFillColor(
      Math.round(C.emerald[0] * opacity + C.darkBg[0] * (1 - opacity)),
      Math.round(C.emerald[1] * opacity + C.darkBg[1] * (1 - opacity)),
      Math.round(C.emerald[2] * opacity + C.darkBg[2] * (1 - opacity)),
    );
    doc.circle(pageW - 40, 60, radius, "F");
  }

  // Linha decorativa verde no topo
  doc.setFillColor(C.emerald[0], C.emerald[1], C.emerald[2]);
  doc.rect(0, 0, pageW, 4, "F");

  // Eyebrow / categoria
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(C.emeraldGlow[0], C.emeraldGlow[1], C.emeraldGlow[2]);
  doc.text("DIAGNÓSTICO ESTRATÉGICO", 60, 90);

  // Linha sob eyebrow
  doc.setDrawColor(C.emerald[0], C.emerald[1], C.emerald[2]);
  doc.setLineWidth(1.5);
  doc.line(60, 100, 220, 100);

  // Título principal — usa charSpace 0 explícito para evitar kerning quebrado
  // em fontes grandes. Também aplica splitTextToSize para garantir layout.
  doc.setCharSpace(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.setTextColor(255, 255, 255);
  doc.text("Relatório", 60, 160);
  doc.setTextColor(C.emeraldGlow[0], C.emeraldGlow[1], C.emeraldGlow[2]);
  doc.text("de Diagnóstico", 60, 200);

  // Subtítulo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(180, 200, 190);
  const subtitle = doc.splitTextToSize(
    "Análise estratégica baseada em IA com recomendações acionáveis para os próximos 365 dias.",
    pageW - 120,
  ) as string[];
  let yy = 230;
  subtitle.forEach((line) => {
    doc.text(line, 60, yy);
    yy += 18;
  });

  // Card central com empresa + score
  const cardY = pageH / 2 + 40;
  const cardH = 180;
  const cardW = pageW - 120;
  const cardX = 60;

  // Card background (semi-transparente sobre fundo escuro)
  doc.setFillColor(20, 36, 28);
  doc.roundedRect(cardX, cardY, cardW, cardH, 12, 12, "F");
  // Borda fina verde
  doc.setDrawColor(C.emerald[0], C.emerald[1], C.emerald[2]);
  doc.setLineWidth(0.8);
  doc.roundedRect(cardX, cardY, cardW, cardH, 12, 12, "S");

  // Conteúdo do card: 2 colunas
  // Coluna esquerda: empresa + segmento
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 165, 155);
  doc.text("EMPRESA / MARCA", cardX + 24, cardY + 28);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  const empresa = safe(diag.empresa_nome, "Não informado");
  const empresaLines = doc.splitTextToSize(empresa, cardW / 2 - 40) as string[];
  let yE = cardY + 50;
  empresaLines.slice(0, 2).forEach((line) => {
    doc.text(line, cardX + 24, yE);
    yE += 22;
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(C.emeraldGlow[0], C.emeraldGlow[1], C.emeraldGlow[2]);
  doc.text(`SEGMENTO: ${safe(diag.segmento).toUpperCase()}`, cardX + 24, cardY + cardH - 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(140, 165, 155);
  const dataConcluido = diag.concluido_em
    ? new Date(diag.concluido_em).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : new Date(diag.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
  doc.text(`EMITIDO EM ${dataConcluido.toUpperCase()}`, cardX + 24, cardY + cardH - 30);

  // Coluna direita: score grande
  const scoreX = cardX + cardW - 140;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 165, 155);
  doc.text("SCORE DE MATURIDADE", scoreX, cardY + 28);

  const score = diag.score ?? 0;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(64);
  doc.setTextColor(C.emeraldGlow[0], C.emeraldGlow[1], C.emeraldGlow[2]);
  doc.text(String(score), scoreX, cardY + 100);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(180, 200, 190);
  doc.text("/ 100", scoreX + 70, cardY + 100);

  // Mini-bar abaixo do score
  const barW = 100;
  const barH = 6;
  const barX = scoreX;
  const barY = cardY + 120;
  doc.setFillColor(40, 56, 48);
  doc.roundedRect(barX, barY, barW, barH, 3, 3, "F");
  doc.setFillColor(C.emerald[0], C.emerald[1], C.emerald[2]);
  doc.roundedRect(barX, barY, (barW * Math.min(score, 100)) / 100, barH, 3, 3, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(C.emeraldGlow[0], C.emeraldGlow[1], C.emeraldGlow[2]);
  doc.text(classificarScore(score), scoreX, cardY + 145);

  // Rodapé da capa
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(110, 130, 122);
  doc.text("Confidencial · Gerado por IA com base em dados verificados", 60, pageH - 40);
  doc.setTextColor(C.emeraldGlow[0], C.emeraldGlow[1], C.emeraldGlow[2]);
  doc.text("•", pageW - 75, pageH - 40);
  doc.setTextColor(140, 165, 155);
  doc.text("Página de capa", pageW - 65, pageH - 40);
}

// =====================================================
// SUMÁRIO clicável (página 2)
// =====================================================
function drawSumario(
  doc: jsPDF,
  pageW: number,
  pageH: number,
  margin: number,
  contentW: number,
  toc: Array<{ label: string; page: number; y: number }>,
  empresa: string,
) {
  doc.setCharSpace(0);

  // Fundo branco padrão (já é default)
  // Top accent verde
  doc.setFillColor(C.emerald[0], C.emerald[1], C.emerald[2]);
  doc.rect(0, 0, pageW, 4, "F");

  let y = margin + 40;

  // Eyebrow
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(C.emerald[0], C.emerald[1], C.emerald[2]);
  doc.text("ÍNDICE", margin, y);
  y += 14;

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  doc.text("Sumário", margin, y + 18);
  y += 32;

  // Linha decorativa verde
  doc.setDrawColor(C.emerald[0], C.emerald[1], C.emerald[2]);
  doc.setLineWidth(2);
  doc.line(margin, y, margin + 48, y);
  y += 28;

  // Subtítulo descritivo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
  doc.text(
    `Navegue pelas seções deste relatório de ${empresa}. Clique para ir direto.`,
    margin,
    y,
  );
  y += 28;

  // Lista de entradas
  const rowH = 28;
  toc.forEach((entry, idx) => {
    const rowY = y;

    // Linha de fundo zebra
    if (idx % 2 === 0) {
      doc.setFillColor(C.surface[0], C.surface[1], C.surface[2]);
      doc.roundedRect(margin, rowY - 16, contentW, rowH, 4, 4, "F");
    }

    // Número
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(C.emerald[0], C.emerald[1], C.emerald[2]);
    const num = String(idx + 1).padStart(2, "0");
    doc.text(num, margin + 8, rowY);

    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11.5);
    doc.setTextColor(C.text[0], C.text[1], C.text[2]);
    doc.text(entry.label, margin + 38, rowY);

    // Dots de preenchimento (visual)
    const labelW = doc.getTextWidth(entry.label);
    const dotsStart = margin + 38 + labelW + 8;
    const dotsEnd = margin + contentW - 36;
    if (dotsEnd > dotsStart) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(C.textSubtle[0], C.textSubtle[1], C.textSubtle[2]);
      const dotW = doc.getTextWidth(".");
      const dotCount = Math.floor((dotsEnd - dotsStart) / (dotW + 1));
      let dotStr = "";
      for (let i = 0; i < dotCount; i++) dotStr += " .";
      doc.text(dotStr, dotsStart, rowY);
    }

    // Página
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(C.emerald[0], C.emerald[1], C.emerald[2]);
    doc.text(String(entry.page), margin + contentW - 8, rowY, { align: "right" });

    // Link clicável cobrindo a linha inteira
    doc.link(margin, rowY - 16, contentW, rowH, {
      pageNumber: entry.page,
      top: Math.max(entry.y - 30, 0),
    });

    y += rowH;

    // Quebra automática se passar do limite (improvável mas seguro)
    if (y > pageH - margin - 80) return;
  });

  // Rodapé do sumário
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(C.textSubtle[0], C.textSubtle[1], C.textSubtle[2]);
  doc.text(
    "Dica: clique em qualquer item do sumário para saltar diretamente para a seção correspondente.",
    margin,
    pageH - margin - 16,
  );
}

// =====================================================
// HEADER / FOOTER
// =====================================================
function drawHeader(doc: jsPDF, pageW: number, margin: number, empresa: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(C.emerald[0], C.emerald[1], C.emerald[2]);
  doc.text("DIAGNÓSTICO ESTRATÉGICO", margin, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(C.textSubtle[0], C.textSubtle[1], C.textSubtle[2]);
  const empresaTxt = safe(empresa, "—");
  doc.text(empresaTxt, pageW - margin, 28, { align: "right" });

  doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, 36, pageW - margin, 36);
}

function drawFooter(
  doc: jsPDF,
  pageW: number,
  pageH: number,
  margin: number,
  pageIdx: number,
  totalPages: number,
) {
  doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, pageH - 40, pageW - margin, pageH - 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(C.textSubtle[0], C.textSubtle[1], C.textSubtle[2]);
  doc.text(
    `Página ${pageIdx} de ${totalPages}`,
    pageW - margin,
    pageH - 24,
    { align: "right" },
  );
  doc.text(
    `Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
    margin,
    pageH - 24,
  );
}

// =====================================================
// PRIMITIVOS de seção
// =====================================================
function sectionEyebrow(doc: jsPDF, text: string, x: number, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(C.emerald[0], C.emerald[1], C.emerald[2]);
  doc.text(text, x, y);
}

function sectionTitle(doc: jsPDF, text: string, x: number, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  doc.text(text, x, y);
  // Underline accent verde
  doc.setDrawColor(C.emerald[0], C.emerald[1], C.emerald[2]);
  doc.setLineWidth(2);
  doc.line(x, y + 6, x + 32, y + 6);
}

function paragraph(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  opts: { size?: number; bold?: boolean; color?: [number, number, number]; lineHeight?: number },
  ensureSpace?: (n: number) => void,
): number {
  const size = opts.size ?? 10;
  const lineHeight = opts.lineHeight ?? size + 3;
  const color = opts.color ?? C.text;
  doc.setFont("helvetica", opts.bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
  // Suporta múltiplos parágrafos separados por \n\n
  const blocks = text.split(/\n\n+/);
  let yy = y;
  blocks.forEach((block, idx) => {
    const lines = doc.splitTextToSize(block.trim(), width) as string[];
    for (const line of lines) {
      if (ensureSpace) ensureSpace(lineHeight);
      doc.text(line, x, yy);
      yy += lineHeight;
    }
    if (idx < blocks.length - 1) yy += lineHeight * 0.5;
  });
  return yy;
}

function drawCallout(
  doc: jsPDF,
  text: string,
  label: string,
  x: number,
  y: number,
  width: number,
  accent: [number, number, number],
): number {
  // Sidebar accent
  doc.setFillColor(accent[0], accent[1], accent[2]);
  // Mede a altura primeiro
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(text, width - 28) as string[];
  const innerH = lines.length * 14 + 36;
  // Background sutil
  doc.setFillColor(240, 252, 246);
  doc.roundedRect(x, y, width, innerH, 6, 6, "F");
  // Sidebar
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(x, y, 4, innerH, "F");
  // Label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(label.toUpperCase(), x + 16, y + 16);
  // Texto
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  let yy = y + 34;
  lines.forEach((line) => {
    doc.text(line, x + 16, yy);
    yy += 14;
  });
  return y + innerH;
}

// =====================================================
// SCORE PANEL
// =====================================================
function drawScorePanel(
  doc: jsPDF,
  score: number,
  classificacao: string,
  x: number,
  y: number,
  width: number,
): number {
  const h = 90;
  // Container
  doc.setFillColor(C.surface[0], C.surface[1], C.surface[2]);
  doc.roundedRect(x, y, width, h, 8, 8, "F");
  doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, width, h, 8, 8, "S");

  // Score number (esquerda)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(48);
  doc.setTextColor(C.emerald[0], C.emerald[1], C.emerald[2]);
  doc.text(String(Math.round(score)), x + 24, y + 60);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
  doc.text("/ 100", x + 80, y + 60);

  // Bar + classificação (direita)
  const barX = x + 140;
  const barW = width - 160;
  const barH = 10;
  const barY = y + 38;

  // Track
  doc.setFillColor(C.border[0], C.border[1], C.border[2]);
  doc.roundedRect(barX, barY, barW, barH, 5, 5, "F");
  // Fill — cor baseada no score
  const fillColor =
    score >= 70 ? C.success : score >= 40 ? C.warning : C.danger;
  doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
  doc.roundedRect(barX, barY, (barW * Math.min(score, 100)) / 100, barH, 5, 5, "F");

  // Marcadores
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(C.textSubtle[0], C.textSubtle[1], C.textSubtle[2]);
  doc.text("0", barX, barY + barH + 12);
  doc.text("Inicial", barX + barW * 0.15, barY + barH + 12, { align: "center" });
  doc.text("Em desenv.", barX + barW * 0.45, barY + barH + 12, { align: "center" });
  doc.text("Estabelecido", barX + barW * 0.75, barY + barH + 12, { align: "center" });
  doc.text("100", barX + barW, barY + barH + 12, { align: "right" });

  // Classificação textual no topo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  const classLines = doc.splitTextToSize(classificacao, barW) as string[];
  doc.text(classLines[0] ?? "", barX, y + 24);

  return y + h;
}

function classificarScore(s: number): string {
  if (s < 30) return "Negócio em estruturação inicial";
  if (s < 60) return "Em desenvolvimento com tração inicial";
  if (s < 85) return "Estabelecido com gargalos de escala";
  return "Maduro, pronto para expansão";
}

// =====================================================
// SWOT 2x2
// =====================================================
function drawSwot(
  doc: jsPDF,
  swot: NonNullable<AnalisePayload["swot"]>,
  x: number,
  y: number,
  width: number,
  ensureSpace: (n: number) => void,
): number {
  const gap = 12;
  const cellW = (width - gap) / 2;
  // Estima altura dinamicamente
  const cells: Array<{
    title: string;
    items: string[];
    bg: [number, number, number];
    border: [number, number, number];
  }> = [
    {
      title: "FORÇAS",
      items: swot.forcas ?? [],
      bg: C.swotForcas,
      border: C.swotForcasBorder,
    },
    {
      title: "FRAQUEZAS",
      items: swot.fraquezas ?? [],
      bg: C.swotFraquezas,
      border: C.swotFraquezasBorder,
    },
    {
      title: "OPORTUNIDADES",
      items: swot.oportunidades ?? [],
      bg: C.swotOportunidades,
      border: C.swotOportunidadesBorder,
    },
    {
      title: "AMEAÇAS",
      items: swot.ameacas ?? [],
      bg: C.swotAmeacas,
      border: C.swotAmeacasBorder,
    },
  ];

  // Calcular altura por linha (top: forcas/fraquezas, bottom: oport/ameacas)
  const cellHeight = (items: string[]): number => {
    let h = 36; // header
    doc.setFontSize(9);
    items.forEach((it) => {
      const lines = doc.splitTextToSize(`• ${it}`, cellW - 24) as string[];
      h += lines.length * 12 + 4;
    });
    return Math.max(h, 100);
  };

  const rowTopH = Math.max(cellHeight(cells[0].items), cellHeight(cells[1].items));
  const rowBotH = Math.max(cellHeight(cells[2].items), cellHeight(cells[3].items));
  const totalH = rowTopH + rowBotH + gap;

  ensureSpace(totalH + 10);

  const drawCell = (
    cx: number,
    cy: number,
    cw: number,
    ch: number,
    cell: typeof cells[0],
  ) => {
    // Background
    doc.setFillColor(cell.bg[0], cell.bg[1], cell.bg[2]);
    doc.roundedRect(cx, cy, cw, ch, 6, 6, "F");
    // Top accent line
    doc.setFillColor(cell.border[0], cell.border[1], cell.border[2]);
    doc.rect(cx, cy, cw, 3, "F");
    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(cell.border[0], cell.border[1], cell.border[2]);
    doc.text(cell.title, cx + 12, cy + 20);
    // Items
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(C.text[0], C.text[1], C.text[2]);
    let yy = cy + 36;
    cell.items.forEach((it) => {
      const lines = doc.splitTextToSize(`• ${it}`, cw - 24) as string[];
      lines.forEach((line) => {
        doc.text(line, cx + 12, yy);
        yy += 12;
      });
      yy += 4;
    });
  };

  drawCell(x, y, cellW, rowTopH, cells[0]);
  drawCell(x + cellW + gap, y, cellW, rowTopH, cells[1]);
  drawCell(x, y + rowTopH + gap, cellW, rowBotH, cells[2]);
  drawCell(x + cellW + gap, y + rowTopH + gap, cellW, rowBotH, cells[3]);

  return y + totalH;
}

// =====================================================
// GARGALOS
// =====================================================
function drawGargalo(
  doc: jsPDF,
  g: Gargalo,
  numero: number,
  x: number,
  y: number,
  width: number,
  ensureSpace: (n: number) => void,
): number {
  // Mede altura
  doc.setFontSize(10);
  const descLines = doc.splitTextToSize(safe(g.descricao, "—"), width - 70) as string[];
  const causaLines = doc.splitTextToSize(safe(g.causa_raiz, "—"), width - 70) as string[];
  const impLines = doc.splitTextToSize(safe(g.impacto_no_negocio, "—"), width - 70) as string[];
  const h =
    36 + descLines.length * 12 + 18 + causaLines.length * 12 + 18 + impLines.length * 12 + 16;

  ensureSpace(h + 8);

  // Card background
  doc.setFillColor(C.surface[0], C.surface[1], C.surface[2]);
  doc.roundedRect(x, y, width, h, 6, 6, "F");
  doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, width, h, 6, 6, "S");

  // Sidebar danger
  doc.setFillColor(C.danger[0], C.danger[1], C.danger[2]);
  doc.rect(x, y, 4, h, "F");

  // Número em badge
  doc.setFillColor(C.danger[0], C.danger[1], C.danger[2]);
  doc.circle(x + 28, y + 24, 11, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(String(numero), x + 28, y + 28, { align: "center" });

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  const tituloLines = doc.splitTextToSize(safe(g.titulo, "(sem título)"), width - 60) as string[];
  doc.text(tituloLines[0] ?? "", x + 48, y + 28);

  let yy = y + 48;
  // Descrição
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
  doc.text("SINTOMA", x + 48, yy);
  yy += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  descLines.forEach((line) => {
    doc.text(line, x + 48, yy);
    yy += 12;
  });
  yy += 6;

  // Causa raiz
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
  doc.text("CAUSA-RAIZ", x + 48, yy);
  yy += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  causaLines.forEach((line) => {
    doc.text(line, x + 48, yy);
    yy += 12;
  });
  yy += 6;

  // Impacto
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(C.danger[0], C.danger[1], C.danger[2]);
  doc.text("IMPACTO NO NEGÓCIO", x + 48, yy);
  yy += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  impLines.forEach((line) => {
    doc.text(line, x + 48, yy);
    yy += 12;
  });

  return y + h;
}

// =====================================================
// RECOMENDAÇÕES
// =====================================================
function drawRecomendacao(
  doc: jsPDF,
  r: Recomendacao,
  numero: number,
  x: number,
  y: number,
  width: number,
  ensureSpace: (n: number) => void,
): number {
  const accent =
    r.prioridade === "alta" ? C.danger : r.prioridade === "media" ? C.warning : C.info;

  // Mede altura
  doc.setFontSize(11);
  const tituloLines = doc.splitTextToSize(safe(r.titulo, "(sem título)"), width - 60) as string[];
  doc.setFontSize(9.5);
  const contextoLines = r.contexto
    ? (doc.splitTextToSize(r.contexto, width - 32) as string[])
    : [];
  const planoCount = r.plano_acao?.length ?? 0;
  let planoH = 0;
  if (planoCount > 0) {
    planoH += 16; // label
    r.plano_acao?.forEach((p) => {
      const lines = doc.splitTextToSize(`${p}`, width - 56) as string[];
      planoH += lines.length * 12 + 4;
    });
  }
  const metaH = 36; // KPI + prazo + chips
  const h =
    tituloLines.length * 14 +
    18 + // gap
    (contextoLines.length > 0 ? contextoLines.length * 12 + 12 : 0) +
    planoH +
    metaH +
    32;

  ensureSpace(h + 10);

  // Card
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, h, 8, 8, "F");
  doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, width, h, 8, 8, "S");

  // Top accent stripe
  doc.setFillColor(accent[0], accent[1], accent[2]);
  // Top stripe arredondada simulada com retângulo + canto
  doc.rect(x, y, width, 3, "F");

  // Numero badge
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.circle(x + 24, y + 28, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(String(r.numero ?? numero), x + 24, y + 32, { align: "center" });

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  let yy = y + 26;
  tituloLines.forEach((line, i) => {
    doc.text(line, x + 44, yy + i * 14);
  });
  yy += tituloLines.length * 14 + 6;

  // Chips de prioridade / impacto / esforço (linha)
  yy += 4;
  let chipX = x + 44;
  if (r.prioridade) {
    chipX = drawChip(doc, `Prioridade: ${r.prioridade.toUpperCase()}`, chipX, yy, accent, true);
  }
  if (r.impacto) {
    const impColor =
      r.impacto === "alto" ? C.success : r.impacto === "medio" ? C.warning : C.textMuted;
    chipX = drawChip(doc, `Impacto: ${r.impacto}`, chipX + 6, yy, impColor, false);
  }
  if (r.esforco) {
    chipX = drawChip(doc, `Esforço: ${r.esforco}`, chipX + 6, yy, C.textMuted, false);
  }
  if (r.categoria) {
    chipX = drawChip(doc, r.categoria, chipX + 6, yy, C.emerald, false);
  }
  yy += 22;

  // Contexto
  if (contextoLines.length > 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
    contextoLines.forEach((line) => {
      doc.text(line, x + 16, yy);
      yy += 12;
    });
    yy += 6;
  }

  // Plano de ação
  if (planoCount > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(C.emerald[0], C.emerald[1], C.emerald[2]);
    doc.text("PLANO DE AÇÃO", x + 16, yy);
    yy += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(C.text[0], C.text[1], C.text[2]);
    r.plano_acao?.forEach((p, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${p}`, width - 56) as string[];
      lines.forEach((line, li) => {
        doc.text(line, x + 28 + (li > 0 ? 12 : 0), yy);
        yy += 12;
      });
      yy += 2;
    });
    yy += 4;
  }

  // KPI + prazo
  doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
  doc.setLineWidth(0.3);
  doc.line(x + 16, yy, x + width - 16, yy);
  yy += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
  doc.text("KPI DE SUCESSO", x + 16, yy);
  doc.text("PRAZO", x + width / 2 + 8, yy);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  const kpiTxt = safe(r.kpi_sucesso, "—");
  const kpiLines = doc.splitTextToSize(kpiTxt, width / 2 - 20) as string[];
  doc.text(kpiLines[0] ?? "", x + 16, yy + 14);
  doc.text(safe(r.prazo, "—"), x + width / 2 + 8, yy + 14);

  return y + h;
}

function drawChip(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  color: [number, number, number],
  filled: boolean,
): number {
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  const textW = doc.getTextWidth(text);
  const padX = 6;
  const w = textW + padX * 2;
  const h = 12;

  if (filled) {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, y - 9, w, h, 6, 6, "F");
    doc.setTextColor(255, 255, 255);
  } else {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y - 9, w, h, 6, 6, "S");
    doc.setTextColor(color[0], color[1], color[2]);
  }
  doc.text(text, x + padX, y - 1);
  return x + w;
}

// =====================================================
// ROADMAP timeline
// =====================================================
function drawRoadmap(
  doc: jsPDF,
  roadmap: NonNullable<AnalisePayload["roadmap"]>,
  x: number,
  y: number,
  width: number,
  ensureSpace: (n: number) => void,
): number {
  const horizontes: Array<{ label: string; marcos: Marco[]; color: [number, number, number] }> = [
    { label: "90 DIAS — QUICK WINS", marcos: roadmap.dias_90 ?? [], color: C.success },
    { label: "180 DIAS — CONSOLIDAÇÃO", marcos: roadmap.dias_180 ?? [], color: C.info },
    { label: "365 DIAS — ESCALA", marcos: roadmap.dias_365 ?? [], color: C.emeraldGlow as [number, number, number] },
  ];

  let yy = y;
  horizontes.forEach((h) => {
    if (h.marcos.length === 0) return;

    // Mede altura do bloco
    let blockH = 28; // header
    h.marcos.forEach((m) => {
      doc.setFontSize(10);
      const tituloLines = doc.splitTextToSize(safe(m.titulo, "—"), width - 50) as string[];
      doc.setFontSize(9);
      const descLines = doc.splitTextToSize(safe(m.descricao, "—"), width - 50) as string[];
      blockH += tituloLines.length * 12 + descLines.length * 11 + 18;
    });

    ensureSpace(blockH + 10);

    // Header do horizonte
    doc.setFillColor(h.color[0], h.color[1], h.color[2]);
    doc.roundedRect(x, yy, width, 22, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(h.label, x + 12, yy + 14);
    yy += 28;

    // Marcos
    h.marcos.forEach((m, idx) => {
      // Bullet
      doc.setFillColor(h.color[0], h.color[1], h.color[2]);
      doc.circle(x + 8, yy + 4, 3, "F");
      // Linha vertical conectando se não for último
      if (idx < h.marcos.length - 1) {
        doc.setDrawColor(h.color[0], h.color[1], h.color[2]);
        doc.setLineWidth(0.8);
        doc.line(x + 8, yy + 8, x + 8, yy + 50);
      }

      // Título
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(C.text[0], C.text[1], C.text[2]);
      const tituloLines = doc.splitTextToSize(safe(m.titulo, "—"), width - 50) as string[];
      tituloLines.forEach((line, i) => {
        doc.text(line, x + 22, yy + 6 + i * 12);
      });
      let inner = yy + 6 + tituloLines.length * 12;

      // Descrição
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
      const descLines = doc.splitTextToSize(safe(m.descricao, "—"), width - 50) as string[];
      descLines.forEach((line) => {
        doc.text(line, x + 22, inner);
        inner += 11;
      });

      // KPI
      if (m.kpi) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(h.color[0], h.color[1], h.color[2]);
        doc.text(`KPI: ${m.kpi}`, x + 22, inner + 2);
        inner += 12;
      }

      yy = inner + 8;
    });

    yy += 8;
  });

  return yy;
}

// =====================================================
// KPIs Tabela
// =====================================================
function drawKpisTable(
  doc: jsPDF,
  kpis: KPI[],
  x: number,
  y: number,
  width: number,
  ensureSpace: (n: number) => void,
): number {
  // Colunas: Nome | Atual | Meta | Como medir
  const colW = [width * 0.28, width * 0.18, width * 0.18, width * 0.36];
  const headerH = 26;
  const rowMinH = 30;

  ensureSpace(headerH + rowMinH * 2 + 20);

  // Header
  doc.setFillColor(C.surface[0], C.surface[1], C.surface[2]);
  doc.roundedRect(x, y, width, headerH, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
  let cx = x + 12;
  ["KPI", "ATUAL (estimado)", "META", "COMO MEDIR"].forEach((label, i) => {
    doc.text(label, cx, y + 17);
    cx += colW[i];
  });
  let yy = y + headerH;

  // Rows
  kpis.forEach((k, idx) => {
    // Mede altura por linha (col descrição é a maior)
    doc.setFontSize(9);
    const nomeLines = doc.splitTextToSize(safe(k.nome, "—"), colW[0] - 16) as string[];
    const atualLines = doc.splitTextToSize(safe(k.valor_atual_estimado, "—"), colW[1] - 16) as string[];
    const metaLines = doc.splitTextToSize(safe(k.meta, "—"), colW[2] - 16) as string[];
    const medirLines = doc.splitTextToSize(safe(k.como_medir, "—"), colW[3] - 16) as string[];
    const lineCount = Math.max(nomeLines.length, atualLines.length, metaLines.length, medirLines.length);
    const rowH = Math.max(rowMinH, lineCount * 11 + 12);

    ensureSpace(rowH + 4);

    // Zebra
    if (idx % 2 === 0) {
      doc.setFillColor(252, 253, 252);
      doc.rect(x, yy, width, rowH, "F");
    }
    // Border bottom
    doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
    doc.setLineWidth(0.3);
    doc.line(x, yy + rowH, x + width, yy + rowH);

    // Conteúdo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(C.text[0], C.text[1], C.text[2]);
    cx = x + 12;
    nomeLines.forEach((line, li) => doc.text(line, cx, yy + 14 + li * 11));

    doc.setFont("helvetica", "normal");
    doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
    cx += colW[0];
    atualLines.forEach((line, li) => doc.text(line, cx, yy + 14 + li * 11));

    doc.setFont("helvetica", "bold");
    doc.setTextColor(C.success[0], C.success[1], C.success[2]);
    cx += colW[1];
    metaLines.forEach((line, li) => doc.text(line, cx, yy + 14 + li * 11));

    doc.setFont("helvetica", "normal");
    doc.setTextColor(C.text[0], C.text[1], C.text[2]);
    cx += colW[2];
    medirLines.forEach((line, li) => doc.text(line, cx, yy + 14 + li * 11));

    yy += rowH;
  });

  return yy;
}

// =====================================================
// RISCOS
// =====================================================
function drawRisco(
  doc: jsPDF,
  r: Risco,
  x: number,
  y: number,
  width: number,
  ensureSpace: (n: number) => void,
): number {
  doc.setFontSize(10);
  const tituloLines = doc.splitTextToSize(safe(r.titulo, "—"), width - 32) as string[];
  doc.setFontSize(9);
  const mitLines = doc.splitTextToSize(safe(r.mitigacao, "—"), width - 32) as string[];
  const h = tituloLines.length * 13 + 18 + mitLines.length * 11 + 28;

  ensureSpace(h + 4);

  // Card
  doc.setFillColor(C.surface[0], C.surface[1], C.surface[2]);
  doc.roundedRect(x, y, width, h, 6, 6, "F");
  doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, width, h, 6, 6, "S");

  // Sidebar warning
  doc.setFillColor(C.warning[0], C.warning[1], C.warning[2]);
  doc.rect(x, y, 4, h, "F");

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  let yy = y + 16;
  tituloLines.forEach((line) => {
    doc.text(line, x + 16, yy);
    yy += 13;
  });
  yy += 4;

  // Chips probabilidade + impacto
  let chipX = x + 16;
  if (r.probabilidade) {
    const c =
      r.probabilidade === "alta" ? C.danger : r.probabilidade === "media" ? C.warning : C.success;
    chipX = drawChip(doc, `Probabilidade: ${r.probabilidade}`, chipX, yy + 6, c, false);
  }
  if (r.impacto) {
    const c =
      r.impacto === "alto" ? C.danger : r.impacto === "medio" ? C.warning : C.success;
    chipX = drawChip(doc, `Impacto: ${r.impacto}`, chipX + 6, yy + 6, c, false);
  }
  yy += 18;

  // Mitigação
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(C.warning[0], C.warning[1], C.warning[2]);
  doc.text("MITIGAÇÃO", x + 16, yy);
  yy += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  mitLines.forEach((line) => {
    doc.text(line, x + 16, yy);
    yy += 11;
  });

  return y + h;
}

// =====================================================
// HANDLER HTTP
// =====================================================
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
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    let payload: Payload;
    try {
      payload = validate(await req.json());
    } catch (e) {
      return new Response(
        JSON.stringify({ error: e instanceof Error ? e.message : "Payload inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const [{ data: diag, error: diagErr }, { data: adminRole }] = await Promise.all([
      adminClient
        .from("diagnosticos")
        .select(
          "id, user_id, empresa_nome, segmento, status, score, resumo_executivo, recomendacoes, respostas, created_at, concluido_em",
        )
        .eq("id", payload.diagnostico_id)
        .maybeSingle(),
      adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", callerId)
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
    if (diag.user_id !== callerId && !isAdmin) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startedAt = Date.now();
    const pdfBytes = buildPdf(diag);

    // Determina próxima versão
    const { data: existentes } = await adminClient
      .from("relatorios_pdf")
      .select("versao")
      .eq("diagnostico_id", payload.diagnostico_id)
      .order("versao", { ascending: false })
      .limit(1);
    const nextVersao = (existentes?.[0]?.versao ?? 0) + 1;

    const path = `${diag.user_id}/${diag.id}/v${nextVersao}.pdf`;

    const { error: upErr } = await adminClient.storage
      .from("relatorios")
      .upload(path, pdfBytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (upErr) {
      console.error("gerar-pdf: upload failed", upErr);
      await adminClient.from("operacoes_ia").insert({
        user_id: callerId,
        diagnostico_id: payload.diagnostico_id,
        tipo: "gerar_pdf",
        sucesso: false,
        erro: upErr.message?.slice(0, 500),
        duracao_ms: Date.now() - startedAt,
      });
      return new Response(JSON.stringify({ error: "Falha ao salvar PDF" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: rel, error: relErr } = await adminClient
      .from("relatorios_pdf")
      .insert({
        diagnostico_id: payload.diagnostico_id,
        user_id: diag.user_id,
        storage_path: path,
        tamanho_bytes: pdfBytes.byteLength,
        versao: nextVersao,
      })
      .select("id, versao, storage_path, tamanho_bytes, created_at")
      .single();

    if (relErr) {
      console.error("gerar-pdf: insert relatorio failed", relErr);
    }

    const { data: signed } = await adminClient.storage
      .from("relatorios")
      .createSignedUrl(path, 300);

    await adminClient.from("operacoes_ia").insert({
      user_id: callerId,
      diagnostico_id: payload.diagnostico_id,
      tipo: "gerar_pdf",
      sucesso: true,
      duracao_ms: Date.now() - startedAt,
    });

    return new Response(
      JSON.stringify({
        success: true,
        relatorio: rel ?? null,
        signed_url: signed?.signedUrl ?? null,
        storage_path: path,
        versao: nextVersao,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("gerar-pdf-diagnostico: unexpected", e);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
