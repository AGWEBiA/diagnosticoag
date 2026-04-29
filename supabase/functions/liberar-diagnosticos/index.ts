// Edge function: liberar-diagnosticos
// Chamada por cron a cada 5 min. Libera diagnósticos que:
//  - estão em 'aguardando_aprovacao'
//  - já têm aprovado_em preenchido
//  - já cumpriram o SLA mínimo (enviado_em + sla_horas <= now)
// Para cada um liberado, registra audit_log para que o admin possa enviar
// notificação manual (WhatsApp/email customizado) se desejar.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: liberados, error } = await admin.rpc(
      "liberar_diagnosticos_pendentes",
    );
    if (error) throw error;

    const lista = (liberados ?? []) as Array<{
      diagnostico_id: string;
      user_id: string;
      email: string | null;
    }>;

    if (lista.length > 0) {
      // Registra evento de liberação para auditoria/admin acompanhar.
      await admin.from("audit_log").insert(
        lista.map((l) => ({
          acao: "diagnostico_liberado",
          entidade: "diagnostico",
          entidade_id: l.diagnostico_id,
          user_id: l.user_id,
          metadata: { email: l.email },
        })),
      );
    }

    return new Response(
      JSON.stringify({ ok: true, liberados: lista.length, ids: lista.map((l) => l.diagnostico_id) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("liberar-diagnosticos error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});