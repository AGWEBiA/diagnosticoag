import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CalendarCheck, ExternalLink, Loader2, LogOut, Shield, AlertCircle } from 'lucide-react';

interface AgendamentoConfig {
  url: string;
  titulo?: string;
  descricao?: string;
}

const Agendar = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, signOut, hasRole } = useAuth();

  const [config, setConfig] = useState<AgendamentoConfig | null>(null);
  const [diagOk, setDiagOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      // 1) Verifica se o diagnóstico pertence ao usuário (RLS já garante isso, mas validamos UX)
      const diagPromise = id
        ? supabase.from('diagnosticos').select('id, status').eq('id', id).maybeSingle()
        : Promise.resolve({ data: null, error: null });

      // 2) Busca config global de agendamento
      const configPromise = supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'agendamento')
        .maybeSingle();

      const [diagRes, cfgRes] = await Promise.all([diagPromise, configPromise]);
      if (cancelled) return;

      setDiagOk(!!diagRes.data);
      const v = (cfgRes.data?.value ?? {}) as unknown as AgendamentoConfig;
      setConfig({
        url: v.url ?? '',
        titulo: v.titulo || 'Agende sua reunião',
        descricao:
          v.descricao ||
          'Seu diagnóstico foi enviado. Escolha um horário para revisarmos o resultado juntos.',
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold">Agendamento</h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {hasRole('admin') && (
              <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                <Shield className="mr-2 h-4 w-4" /> Admin
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate('/diagnostico')}>
              Novo diagnóstico
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <CardTitle>{config?.titulo}</CardTitle>
                <CardDescription className="mt-1">{config?.descricao}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {diagOk === false && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Diagnóstico não encontrado</AlertTitle>
                <AlertDescription>
                  Não conseguimos localizar este diagnóstico. Você ainda pode agendar abaixo.
                </AlertDescription>
              </Alert>
            )}

            {!config?.url ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Agendamento ainda não configurado</AlertTitle>
                <AlertDescription>
                  O administrador ainda não definiu o link de agendamento.{' '}
                  {hasRole('admin') && (
                    <Button
                      variant="link"
                      className="h-auto p-0"
                      onClick={() => navigate('/admin/configuracoes')}
                    >
                      Configurar agora
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <a href={config.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" /> Abrir agenda em nova aba
                    </a>
                  </Button>
                </div>
                <div className="overflow-hidden rounded-md border">
                  <iframe
                    src={config.url}
                    title="Agendamento"
                    className="h-[720px] w-full border-0"
                    loading="lazy"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Caso o agendamento não carregue acima, use o botão para abrir em nova aba.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Agendar;
