 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
 import { render } from 'npm:@react-email/render@2.0.8';
 import { BloqueioEmail } from '../_shared/email-templates/diagnostico-bloqueado.tsx';
 import * as React from 'npm:react@18.3.1';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
 const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
 
   const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
 
   try {
     const { diagnostico_id, motivo } = await req.json();
 
     if (!diagnostico_id) throw new Error('diagnostico_id is required');
 
     // 1. Busca dados do diagnóstico e do usuário
     const { data: diag, error: diagErr } = await supabase
       .from('diagnosticos')
       .select('empresa_nome, user_id, profiles(email, full_name)')
       .eq('id', diagnostico_id)
       .single();
 
     if (diagErr || !diag) throw new Error('Diagnóstico não encontrado');
 
     const email = (diag.profiles as any)?.email;
     const empresaNome = diag.empresa_nome || 'seu negócio';
 
     if (!email) {
       console.warn('Usuário sem email, pulando notificação', diagnostico_id);
       return new Response(JSON.stringify({ ok: true, skipped: 'no email' }), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
     }
 
     // 2. Busca configurações de suporte
     const { data: supportRows } = await supabase
       .from('app_settings')
       .select('value')
       .in('key', ['suporte_email', 'suporte_whatsapp']);
 
     const supportEmail = supportRows?.find(r => (r as any).key === 'suporte_email')?.value as string || 'suporte@exemplo.com';
     const supportWhatsapp = supportRows?.find(r => (r as any).key === 'suporte_whatsapp')?.value as string;
 
     // 3. Renderiza e enfileira o e-mail
     const html = render(
       React.createElement(BloqueioEmail, {
         siteName: 'Diagnóstico IA',
         empresaNome,
         motivo: motivo || 'Estorno ou irregularidade no pagamento.',
         supportEmail,
         supportWhatsapp,
       })
     );
 
     const payload = {
       to: email,
       subject: `⚠️ Acesso Bloqueado: Diagnóstico ${empresaNome}`,
       html,
       label: 'notificacao_bloqueio',
       priority: 'high',
     };
 
     const { error: queueErr } = await supabase.rpc('enqueue_email', {
       queue_name: 'transactional_emails',
       payload,
     });
 
     if (queueErr) throw queueErr;
 
     return new Response(JSON.stringify({ ok: true }), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
   } catch (e) {
     console.error('[notificar-bloqueio] erro:', e);
     return new Response(JSON.stringify({ error: e.message }), {
       status: 500,
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
   }
 });