// Gera PDF do relatório de um diagnóstico, salva no bucket privado `relatorios`
// e registra metadados em `relatorios_pdf`. Acesso: dono ou admin.

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
  const diagnostico_id = typeof o.diagnostico_id === "string" ? o.diagnostico_id.trim() : "";
  if (!/^[0-9a-f-]{36}$/i.test(diagnostico_id)) throw new Error("diagnostico_id inválido");
  return { diagnostico_id };
}

function safe(s: unknown, fallback = "—"): string {
  if (s === null || s === undefined) return fallback;
  const t = String(s).trim();
  return t.length ? t : fallback;
}

function buildPdf(diag: {
  empresa_nome: string | null;
  segmento: string | null;
  status: string;
  score: number | null;
  resumo_executivo: string | null;
  recomendacoes: unknown;
  respostas: unknown;
  created_at: string;
  concluido_em: string | null;
}): Uint8Array {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const title = (text: string, size = 18) => {
    ensureSpace(size + 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(20, 20, 30);
    doc.text(text, margin, y);
    y += size + 8;
  };

  const subtitle = (text: string) => {
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(60, 60, 80);
    doc.text(text, margin, y);
    y += 16;
  };

  const para = (text: string, opts: { bold?: boolean; size?: number; color?: [number, number, number] } = {}) => {
    const size = opts.size ?? 10.5;
    const color = opts.color ?? [40, 40, 40];
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const wrapped = doc.splitTextToSize(text, pageW - margin * 2) as string[];
    for (const line of wrapped) {
      ensureSpace(size + 4);
      doc.text(line, margin, y);
      y += size + 3;
    }
  };

  const hr = () => {
    ensureSpace(12);
    doc.setDrawColor(220);
    doc.line(margin, y, pageW - margin, y);
    y += 10;
  };

  // Cabeçalho
  title(`Relatório de Diagnóstico`, 20);
  para(`Empresa: ${safe(diag.empresa_nome)}`, { bold: true });
  para(`Segmento: ${safe(diag.segmento)}`);
  para(`Status: ${safe(diag.status)}`);
  para(`Score de maturidade: ${diag.score ?? "—"} / 100`);
  para(
    `Criado em: ${new Date(diag.created_at).toLocaleString("pt-BR")}${
      diag.concluido_em ? ` · Concluído em: ${new Date(diag.concluido_em).toLocaleString("pt-BR")}` : ""
    }`,
    { color: [120, 120, 130] }
  );
  hr();

  // Resumo executivo
  subtitle("Resumo executivo");
  para(diag.resumo_executivo?.trim() || "Não há resumo executivo gerado para este diagnóstico.");
  hr();

  // Recomendações
  subtitle("Recomendações priorizadas");
  const recos = Array.isArray(diag.recomendacoes)
    ? (diag.recomendacoes as Array<{ titulo?: string; descricao?: string; impacto?: string; prioridade?: number }>)
    : [];
  if (!recos.length) {
    para("Nenhuma recomendação disponível.");
  } else {
    recos.forEach((r, i) => {
      ensureSpace(40);
      const head = `${r.prioridade ?? i + 1}. ${safe(r.titulo, "(sem título)")}${r.impacto ? `  [impacto: ${r.impacto}]` : ""}`;
      para(head, { bold: true, size: 11 });
      if (r.descricao) para(r.descricao, { size: 10 });
      y += 4;
    });
  }
  hr();

  // Respostas (resumo)
  subtitle("Respostas do diagnóstico");
  let respostasTxt = "(sem respostas registradas)";
  try {
    const r = diag.respostas;
    if (r && typeof r === "object") {
      respostasTxt = JSON.stringify(r, null, 2);
    }
  } catch {
    /* ignore */
  }
  // Limitar tamanho impresso
  if (respostasTxt.length > 6000) respostasTxt = respostasTxt.slice(0, 6000) + "\n…(truncado)";
  para(respostasTxt, { size: 8.5, color: [60, 60, 70] });

  // Rodapé com paginação
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      `Página ${i} de ${pageCount} · gerado em ${new Date().toLocaleString("pt-BR")}`,
      pageW / 2,
      pageH - 20,
      { align: "center" }
    );
  }

  const ab = doc.output("arraybuffer");
  return new Uint8Array(ab);
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
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const [{ data: diag, error: diagErr }, { data: adminRole }] = await Promise.all([
      adminClient
        .from("diagnosticos")
        .select(
          "id, user_id, empresa_nome, segmento, status, score, resumo_executivo, recomendacoes, respostas, created_at, concluido_em"
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

    // Caminho: <user_id_dono>/<diagnostico_id>/v{n}.pdf
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

    // Registra metadado
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

    // Signed URL para download imediato (válida 5 min)
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
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("gerar-pdf-diagnostico: unexpected", e);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
