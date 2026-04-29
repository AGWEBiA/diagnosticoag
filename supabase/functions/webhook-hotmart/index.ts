// Webhook público da Hotmart. Token validado contra app_settings (gateways_webhooks.hotmart_token).
// Eventos esperados: PURCHASE_APPROVED, PURCHASE_COMPLETE.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface HotmartPayload {
  event?: string;
  data?: {
    buyer?: { email?: string; name?: string };
    purchase?: {
      transaction?: string;
      status?: string;
      approved_date?: number;
      price?: { value?: number; currency_code?: string };
      commission_as?: string;
      commissions?: Array<{
        name?: string;
        source?: string; // PRODUCER, COPRODUCER, AFFILIATE, MARKETPLACE
        currency_value_code?: string;
        value?: number;
      }>;
    };
    product?: { id?: number | string; name?: string };
    subscription?: { plan?: { id?: number | string; name?: string } };
    offer?: { code?: string };
    refund?: { reason?: string };
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  // 1. Lê token configurado no admin
  const { data: settingRow } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'gateways_webhooks')
    .maybeSingle();

  const tokenEsperado =
    (settingRow?.value as { hotmart_token?: string } | null)?.hotmart_token ?? '';

  // 2. Valida token (header oficial Hotmart: x-hotmart-hottok; também aceita ?token=)
  const tokenRecebido =
    req.headers.get('x-hotmart-hottok') ??
    new URL(req.url).searchParams.get('token') ??
    '';

  if (!tokenEsperado || tokenRecebido !== tokenEsperado) {
    console.warn('[hotmart] token inválido ou não configurado');
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let payload: HotmartPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const event = payload.event ?? '';
  const status = payload.data?.purchase?.status ?? '';
  const approved =
    /APPROVED|COMPLETE/i.test(event) || /APPROVED|COMPLETE|PAID/i.test(status);
  const refunded =
    /REFUNDED|CHARGEBACK|CANCELLED|CANCELED|DISPUTE/i.test(event) ||
    /REFUNDED|CHARGEBACK|CANCELLED|CANCELED|DISPUTE/i.test(status);

  const transactionId = payload.data?.purchase?.transaction;

  // Refund / chargeback: bloqueia diagnósticos vinculados à transação
  if (refunded && transactionId) {
    const motivo = `Compra estornada (${event || status}). ${payload.data?.refund?.reason ?? ''}`.trim();
    const { data: bloqueados, error: errBloq } = await supabase.rpc(
      'bloquear_por_transacao_estornada',
      { _transacao_id: transactionId, _motivo: motivo },
    );
    if (errBloq) console.error('[hotmart] erro ao bloquear', errBloq);
    return new Response(
      JSON.stringify({ ok: true, refunded: true, diagnosticos_bloqueados: bloqueados ?? 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  if (!approved) {
    return new Response(JSON.stringify({ ok: true, ignored: event || status }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const email = payload.data?.buyer?.email?.toLowerCase().trim();
  const produtoExternoId = String(payload.data?.product?.id ?? '');
  const ofertaExternaId =
    payload.data?.offer?.code ?? (payload.data?.subscription?.plan?.id != null ? String(payload.data.subscription.plan.id) : null);

  if (!email || !transactionId || !produtoExternoId) {
    return new Response(
      JSON.stringify({ error: 'missing fields', need: ['buyer.email','purchase.transaction','product.id'] }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // 3. Idempotência por transaction_id
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

  // 4. Resolve produto -> créditos. Tenta match por (gateway, produto_externo_id, oferta_externa_id), depois sem oferta.
  let produto: { id: string; creditos_concedidos: number } | null = null;

  if (ofertaExternaId) {
    const { data } = await supabase
      .from('produtos_pagamento')
      .select('id, creditos_concedidos')
      .eq('gateway', 'hotmart')
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
      .eq('gateway', 'hotmart')
      .eq('produto_externo_id', produtoExternoId)
      .is('oferta_externa_id', null)
      .eq('ativo', true)
      .maybeSingle();
    produto = data;
  }

  const creditos = produto?.creditos_concedidos ?? 1;

  // Extrai dados financeiros do payload Hotmart
  const precoValor = payload.data?.purchase?.price?.value ?? null;
  const moeda = payload.data?.purchase?.price?.currency_code ?? 'BRL';
  const toCents = (v: number | null | undefined) =>
    v == null ? null : Math.round(Number(v) * 100);
  const valorBrutoCentavos = toCents(precoValor);

  const comissoes = payload.data?.purchase?.commissions ?? [];
  const sumBy = (sources: string[]) =>
    comissoes
      .filter((c) => sources.includes((c.source ?? '').toUpperCase()))
      .reduce((acc, c) => acc + (Number(c.value) || 0), 0);
  const comissaoProdutor = toCents(sumBy(['PRODUCER']));
  const comissaoCoprodutor = toCents(sumBy(['COPRODUCER', 'CO_PRODUCER']));
  const comissaoAfiliado = toCents(sumBy(['AFFILIATE']));
  const taxaGateway =
    valorBrutoCentavos != null
      ? toCents(sumBy(['MARKETPLACE', 'PLATFORM', 'HOTMART']))
      : null;
  // Líquido do produtor = sua comissão (já é o que ele recebe)
  const valorLiquidoCentavos = comissaoProdutor;

  // 5. Encontra usuário pelo email
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  const userId = profile?.id ?? '00000000-0000-0000-0000-000000000000';
  const pendente = !profile?.id;

  if (pendente) {
    console.log('[hotmart] crédito pendente (sem conta) para', email);
  }

  // 6. Insere N créditos (vinculados ao user real ou pendentes pelo email)
  const rows = Array.from({ length: creditos }).map(() => ({
    user_id: userId,
    origem: 'hotmart',
    produto_id: produto?.id ?? null,
    transacao_externa_id: transactionId,
    email_comprador: email,
    valor_bruto_centavos: valorBrutoCentavos,
    taxa_gateway_centavos: taxaGateway,
    comissao_produtor_centavos: comissaoProdutor,
    comissao_coprodutor_centavos: comissaoCoprodutor,
    comissao_afiliado_centavos: comissaoAfiliado,
    valor_liquido_centavos: valorLiquidoCentavos,
    moeda,
    metadata: { event, raw_product: produtoExternoId, oferta: ofertaExternaId, pendente },
  }));
  const { error: insertErr } = await supabase.from('creditos_diagnostico').insert(rows);

  if (insertErr) {
    console.error('[hotmart] insert creditos falhou', insertErr);
    return new Response(JSON.stringify({ error: insertErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, creditos }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
