import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Copy, Eye, EyeOff } from 'lucide-react';

interface GatewaysConfig {
  hotmart_token: string;
  kiwify_token: string;
}

const DEFAULT: GatewaysConfig = { hotmart_token: '', kiwify_token: '' };

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
const baseFnUrl = projectId ? `https://${projectId}.functions.supabase.co` : '';

export const GatewaysWebhooksCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<GatewaysConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHotmart, setShowHotmart] = useState(false);
  const [showKiwify, setShowKiwify] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'gateways_webhooks')
        .maybeSingle();
      if (data?.value) {
        const v = data.value as Partial<GatewaysConfig>;
        setConfig({ ...DEFAULT, ...v });
      }
      setLoading(false);
    })();
  }, []);

  const salvar = async () => {
    setSaving(true);
    const { error } = await supabase.from('app_settings').upsert([
      {
        key: 'gateways_webhooks',
        value: config as unknown as never,
        updated_by: user?.id ?? null,
      },
    ]);
    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Tokens dos gateways salvos' });
  };

  const copiar = (txt: string, nome: string) => {
    navigator.clipboard.writeText(txt);
    toast({ title: 'Copiado', description: nome });
  };

  const hotmartUrl = baseFnUrl ? `${baseFnUrl}/webhook-hotmart` : '/webhook-hotmart';
  const kiwifyUrl = baseFnUrl ? `${baseFnUrl}/webhook-kiwify` : '/webhook-kiwify';

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Webhooks de gateways de pagamento</CardTitle>
        <CardDescription>
          Configure aqui os tokens secretos dos webhooks. Cole as URLs abaixo no painel de cada gateway, junto com o token correspondente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hotmart */}
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Hotmart</h3>
          </div>
          <div>
            <Label className="text-xs">URL do webhook (Postback)</Label>
            <div className="flex gap-2">
              <Input readOnly value={hotmartUrl} className="font-mono text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={() => copiar(hotmartUrl, 'URL Hotmart')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Em <em>Hotmart → Ferramentas → Webhook</em>, cadastre esta URL e use o token abaixo no campo "Hottok".
            </p>
          </div>
          <div>
            <Label htmlFor="cfg-hotmart-token">Token (Hottok)</Label>
            <div className="flex gap-2">
              <Input
                id="cfg-hotmart-token"
                type={showHotmart ? 'text' : 'password'}
                value={config.hotmart_token}
                onChange={(e) => setConfig({ ...config, hotmart_token: e.target.value })}
                placeholder="cole aqui o token configurado na Hotmart"
              />
              <Button type="button" variant="outline" size="icon" onClick={() => setShowHotmart((s) => !s)}>
                {showHotmart ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Kiwify */}
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Kiwify</h3>
          </div>
          <div>
            <Label className="text-xs">URL do webhook</Label>
            <div className="flex gap-2">
              <Input readOnly value={kiwifyUrl} className="font-mono text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={() => copiar(kiwifyUrl, 'URL Kiwify')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Em <em>Kiwify → Apps → Webhooks</em>, cadastre esta URL adicionando <code>?token=SEU_TOKEN</code> no final.
            </p>
          </div>
          <div>
            <Label htmlFor="cfg-kiwify-token">Token</Label>
            <div className="flex gap-2">
              <Input
                id="cfg-kiwify-token"
                type={showKiwify ? 'text' : 'password'}
                value={config.kiwify_token}
                onChange={(e) => setConfig({ ...config, kiwify_token: e.target.value })}
                placeholder="cole aqui o token configurado na Kiwify"
              />
              <Button type="button" variant="outline" size="icon" onClick={() => setShowKiwify((s) => !s)}>
                {showKiwify ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={salvar} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar tokens
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
