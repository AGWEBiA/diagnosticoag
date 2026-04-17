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

interface AgendamentoConfig {
  url: string;
  titulo: string;
  descricao: string;
}

interface IaAlertasConfig {
  custo_diario_limite_usd: number;
}

const DEFAULT: AgendamentoConfig = {
  url: '',
  titulo: 'Agende sua reunião',
  descricao: 'Seu diagnóstico foi enviado. Escolha um horário para revisarmos o resultado juntos.',
};

const DEFAULT_IA: IaAlertasConfig = {
  custo_diario_limite_usd: 1,
};

const ConfiguracoesAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<AgendamentoConfig>(DEFAULT);
  const [iaAlertas, setIaAlertas] = useState<IaAlertasConfig>(DEFAULT_IA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingIa, setSavingIa] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['agendamento', 'ia_alertas']);
      if (!error && data) {
        for (const row of data) {
          if (row.key === 'agendamento') {
            const v = (row.value ?? {}) as Partial<AgendamentoConfig>;
            setConfig({ ...DEFAULT, ...v });
          } else if (row.key === 'ia_alertas') {
            const v = (row.value ?? {}) as Partial<IaAlertasConfig>;
            setIaAlertas({ ...DEFAULT_IA, ...v });
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
        <p className="text-sm text-muted-foreground">
          Ajustes globais da plataforma.
        </p>
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
    </div>
  );
};

export default ConfiguracoesAdmin;
