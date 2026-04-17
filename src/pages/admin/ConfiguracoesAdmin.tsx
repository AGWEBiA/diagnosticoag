import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ExternalLink } from 'lucide-react';
import { GatewaysWebhooksCard } from '@/components/admin/GatewaysWebhooksCard';

interface AgendamentoConfig {
  url: string;
  titulo: string;
  descricao: string;
}

interface IaAlertasConfig {
  custo_diario_limite_usd: number;
}

interface PagamentoConfig {
  titulo: string;
  descricao: string;
}

const DEFAULT: AgendamentoConfig = {
  url: '',
  titulo: 'Agende sua reunião',
  descricao: 'Seu diagnóstico foi enviado. Escolha um horário para revisarmos o resultado juntos.',
};

const DEFAULT_IA: IaAlertasConfig = {
  custo_diario_limite_usd: 1,
};

const DEFAULT_PAG: PagamentoConfig = {
  titulo: 'Solicite seu diagnóstico',
  descricao: 'Cada diagnóstico inclui análise estratégica completa do seu negócio digital com IA vertical.',
};

const ConfiguracoesAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<AgendamentoConfig>(DEFAULT);
  const [iaAlertas, setIaAlertas] = useState<IaAlertasConfig>(DEFAULT_IA);
  const [pagamento, setPagamento] = useState<PagamentoConfig>(DEFAULT_PAG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingIa, setSavingIa] = useState(false);
  const [savingPag, setSavingPag] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['agendamento', 'ia_alertas', 'pagamento']);
      if (!error && data) {
        for (const row of data) {
          if (row.key === 'agendamento') {
            const v = (row.value ?? {}) as Partial<AgendamentoConfig>;
            setConfig({ ...DEFAULT, ...v });
          } else if (row.key === 'ia_alertas') {
            const v = (row.value ?? {}) as Partial<IaAlertasConfig>;
            setIaAlertas({ ...DEFAULT_IA, ...v });
          } else if (row.key === 'pagamento') {
            const v = (row.value ?? {}) as Partial<PagamentoConfig>;
            setPagamento({ ...DEFAULT_PAG, ...v });
          }
        }
      }
      setLoading(false);
    })();
  }, []);

  const salvar = async () => {
    if (config.url && !/^https?:\/\//i.test(config.url)) {
      toast({
        title: 'URL inválida',
        description: 'A URL deve começar com http:// ou https://',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('app_settings')
      .upsert([
        {
          key: 'agendamento',
          value: config as unknown as never,
          updated_by: user?.id ?? null,
        },
      ]);
    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Configurações salvas' });
  };

  const salvarIa = async () => {
    const limite = Number(iaAlertas.custo_diario_limite_usd);
    if (!Number.isFinite(limite) || limite < 0) {
      toast({
        title: 'Limite inválido',
        description: 'Informe um número maior ou igual a zero.',
        variant: 'destructive',
      });
      return;
    }
    setSavingIa(true);
    const { error } = await supabase
      .from('app_settings')
      .upsert([
        {
          key: 'ia_alertas',
          value: { custo_diario_limite_usd: limite } as unknown as never,
          updated_by: user?.id ?? null,
        },
      ]);
    setSavingIa(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Limite de custo IA atualizado' });
  };

  const salvarPagamento = async () => {
    setSavingPag(true);
    const { error } = await supabase.from('app_settings').upsert([
      {
        key: 'pagamento',
        value: pagamento as unknown as never,
        updated_by: user?.id ?? null,
      },
    ]);
    setSavingPag(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Página de compra atualizada' });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Ajustes globais da plataforma.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agendamento pós-diagnóstico</CardTitle>
          <CardDescription>
            Cole o link público do <strong>Google Appointment Schedule</strong> (ex.:{' '}
            <code className="text-xs">https://calendar.app.google/...</code>). Após finalizar o
            diagnóstico, o usuário será direcionado para esta página de agendamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cfg-url">URL do agendamento</Label>
            <Input
              id="cfg-url"
              value={config.url}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              placeholder="https://calendar.app.google/seu-link"
              type="url"
            />
            {config.url && (
              <a
                href={config.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center text-xs text-primary hover:underline"
              >
                <ExternalLink className="mr-1 h-3 w-3" /> Testar link
              </a>
            )}
          </div>
          <div>
            <Label htmlFor="cfg-titulo">Título exibido ao usuário</Label>
            <Input
              id="cfg-titulo"
              value={config.titulo}
              onChange={(e) => setConfig({ ...config, titulo: e.target.value })}
              maxLength={120}
            />
          </div>
          <div>
            <Label htmlFor="cfg-desc">Descrição / instruções</Label>
            <Textarea
              id="cfg-desc"
              rows={3}
              value={config.descricao}
              onChange={(e) => setConfig({ ...config, descricao: e.target.value })}
              maxLength={500}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={salvar} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Página de compra (/comprar)</CardTitle>
          <CardDescription>
            Texto exibido aos usuários que precisam comprar um diagnóstico. Os produtos em si são gerenciados na seção <strong>Produtos</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cfg-pag-titulo">Título</Label>
            <Input
              id="cfg-pag-titulo"
              value={pagamento.titulo}
              onChange={(e) => setPagamento({ ...pagamento, titulo: e.target.value })}
              maxLength={120}
            />
          </div>
          <div>
            <Label htmlFor="cfg-pag-desc">Descrição</Label>
            <Textarea
              id="cfg-pag-desc"
              rows={3}
              value={pagamento.descricao}
              onChange={(e) => setPagamento({ ...pagamento, descricao: e.target.value })}
              maxLength={500}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={salvarPagamento} disabled={savingPag}>
              {savingPag ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      <GatewaysWebhooksCard />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alertas de IA</CardTitle>
          <CardDescription>
            Define o limite de custo diário em USD para uso da IA. Quando o consumo do dia
            ultrapassar este valor, um alerta será exibido em <strong>Métricas</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <Label htmlFor="cfg-custo-limite">Limite de custo diário (USD)</Label>
            <Input
              id="cfg-custo-limite"
              type="number"
              min={0}
              step="0.01"
              value={iaAlertas.custo_diario_limite_usd}
              onChange={(e) =>
                setIaAlertas({
                  ...iaAlertas,
                  custo_diario_limite_usd: Number(e.target.value),
                })
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">Use 0 para desativar o alerta.</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={salvarIa} disabled={savingIa}>
              {savingIa ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfiguracoesAdmin;
