// Webhook público da Kiwify. Token validado contra app_settings (gateways_webhooks.kiwify_token).
// Aceita ?token= ou header x-kiwify-token (configurável no painel Kiwify como query param).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-kiwify-token',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface KiwifyPayload {
  webhook_event_type?: string;
  order_status?: string;
  order_id?: string;
  Customer?: { email?: string; full_name?: string };
  customer?: { email?: string; full_name?: string };
  Product?: { product_id?: string; product_name?: string };
  product?: { product_id?: string; product_name?: string };
  Subscription?: { plan?: { id?: string; name?: string } };
  subscription?: { plan?: { id?: string; name?: string } };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const { data: settingRow } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'gateways_webhooks')
    .maybeSingle();

  const tokenEsperado =
    (settingRow?.value as { kiwify_token?: string } | null)?.kiwify_token ?? '';

  const tokenRecebido =
    req.headers.get('x-kiwify-token') ??
    new URL(req.url).searchParams.get('token') ??
    '';

  if (!tokenEsperado || tokenRecebido !== tokenEsperado) {
    console.warn('[kiwify] token inválido ou não configurado');
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let payload: KiwifyPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const eventType = payload.webhook_event_type ?? '';
  const status = (payload.order_status ?? '').toLowerCase();
  const approved =
    /approved|paid/i.test(eventType) || ['paid', 'approved', 'completed'].includes(status);

  if (!approved) {
    return new Response(JSON.stringify({ ok: true, ignored: eventType || status }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const customer = payload.Customer ?? payload.customer ?? {};
  const product = payload.Product ?? payload.product ?? {};
  const subscription = payload.Subscription ?? payload.subscription ?? {};

  const email = customer.email?.toLowerCase().trim();
  const transactionId = payload.order_id;
  const produtoExternoId = product.product_id ?? '';
  const ofertaExternaId = subscription.plan?.id ?? null;

  if (!email || !transactionId || !produtoExternoId) {
    return new Response(
      JSON.stringify({ error: 'missing fields', need: ['customer.email', 'order_id', 'product.product_id'] }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const { data: existente } = await supabase
    .from('creditos_diagnostico')
    .select('id')
    .eq('transacao_externa_id', transactionId)
    .maybeSingle();
  if (existente) {
    return new Response(JSON.stringify({ ok: true, duplicated: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let produto: { id: string; creditos_concedidos: number } | null = null;
  if (ofertaExternaId) {
    const { data } = await supabase
      .from('produtos_pagamento')
      .select('id, creditos_concedidos')
      .eq('gateway', 'kiwify')
      .eq('produto_externo_id', produtoExternoId)
      .eq('oferta_externa_id', ofertaExternaId)
      .eq('ativo', true)
      .maybeSingle();
    produto = data;
  }
  if (!produto) {
    const { data } = await supabase
      .from('produtos_pagamento')
      .select('id, creditos_concedidos')
      .eq('gateway', 'kiwify')
      .eq('produto_externo_id', produtoExternoId)
      .is('oferta_externa_id', null)
      .eq('ativo', true)
      .maybeSingle();
    produto = data;
  }
  const creditos = produto?.creditos_concedidos ?? 1;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .ilike('email', email)
    .maybeSingle();
  const userId = profile?.id ?? '00000000-0000-0000-0000-000000000000';
  const pendente = !profile?.id;

  if (pendente) {
    console.log('[kiwify] crédito pendente (sem conta) para', email);
  }

  const rows = Array.from({ length: creditos }).map(() => ({
    user_id: userId,
    origem: 'kiwify',
    produto_id: produto?.id ?? null,
    transacao_externa_id: transactionId,
    email_comprador: email,
    metadata: { event: eventType, raw_product: produtoExternoId, oferta: ofertaExternaId, pendente },
  }));
  const { error: insertErr } = await supabase.from('creditos_diagnostico').insert(rows);

  if (insertErr) {
    console.error('[kiwify] insert creditos falhou', insertErr);
    return new Response(JSON.stringify({ error: insertErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, creditos }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
