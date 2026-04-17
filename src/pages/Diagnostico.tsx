import { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { Pergunta, getEtapasPorSegmento, TOTAL_ETAPAS } from '@/config/diagnosticoSchema';
import { PerguntaField } from '@/components/diagnostico/PerguntaField';
import { useDiagnosticoRascunho, Respostas } from '@/hooks/useDiagnosticoRascunho';
import { useCreditos } from '@/hooks/useCreditos';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatarMenu } from '@/components/UserAvatarMenu';
import { supabase } from '@/integrations/supabase/client';

function validarPergunta(p: Pergunta, value: unknown, all: Respostas): string | null {
  if (p.obrigatoria) {
    if (value === undefined || value === null || value === '') return 'Campo obrigatório';
    if (Array.isArray(value) && value.length === 0) return 'Selecione ao menos uma opção';
  }
  if ((p.tipo === 'number' || p.tipo === 'currency' || p.tipo === 'percent') && value !== '' && value !== undefined && value !== null) {
    const n = Number(value);
    if (Number.isNaN(n)) return 'Valor numérico inválido';
    if (p.min !== undefined && n < p.min) return `Mínimo: ${p.min}`;
    if (p.max !== undefined && n > p.max) return `Máximo: ${p.max}`;
  }
  if (p.id === 'estrategia_menor_retorno' && value && value === all.estrategia_maior_retorno) {
    return 'Deve ser diferente da estratégia de maior retorno';
  }
  return null;
}

function validarMetas(r: Respostas): string | null {
  const m90 = Number(r.meta_90_dias ?? 0);
  const m180 = Number(r.meta_180_dias ?? 0);
  const m365 = Number(r.meta_365_dias ?? 0);
  if (m180 && m90 && m180 <= m90) return 'Meta de 180 dias deve ser maior que a de 90 dias';
  if (m365 && m180 && m365 <= m180) return 'Meta de 365 dias deve ser maior que a de 180 dias';
  return null;
}

const Diagnostico = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { state, loading, saving, salvarEtapa, finalizar } = useDiagnosticoRascunho();
  const { creditos, loading: loadingCreditos } = useCreditos();

  const [respostas, setRespostas] = useState<Respostas>({});
  const [etapaIdx, setEtapaIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [aguardandoIA, setAguardandoIA] = useState<string | null>(null);

  // Hidrata estado local quando rascunho carregar
  useEffect(() => {
    if (!loading) {
      setRespostas(state.respostas);
      setEtapaIdx(Math.min(state.etapa_atual, TOTAL_ETAPAS - 1));
    }
  }, [loading, state.respostas, state.etapa_atual]);

  const segmento = (respostas.segmento as string | undefined) ?? state.segmento ?? undefined;
  const etapas = useMemo(() => getEtapasPorSegmento(segmento), [segmento]);
  const etapaAtual = etapas[etapaIdx];
  const isUltima = etapaIdx === etapas.length - 1;

  const handleChange = (id: string, value: unknown) => {
    setRespostas((r) => {
      const next = { ...r, [id]: value };
      // Se mudou estratégias dominadas, limpar maior/menor retorno se não estiverem mais nelas
      if (id === 'estrategias_dominadas') {
        const arr = (value as string[]) ?? [];
        if (next.estrategia_maior_retorno && !arr.includes(next.estrategia_maior_retorno as string)) {
          next.estrategia_maior_retorno = '';
        }
        if (next.estrategia_menor_retorno && !arr.includes(next.estrategia_menor_retorno as string)) {
          next.estrategia_menor_retorno = '';
        }
      }
      return next;
    });
  };

  const validarEtapa = (): boolean => {
    for (const p of etapaAtual.perguntas) {
      const erro = validarPergunta(p, respostas[p.id], respostas);
      if (erro) {
        toast({ title: p.label, description: erro, variant: 'destructive' });
        return false;
      }
    }
    if (etapaAtual.id === 'metas') {
      const erro = validarMetas(respostas);
      if (erro) {
        toast({ title: 'Metas inválidas', description: erro, variant: 'destructive' });
        return false;
      }
    }
    return true;
  };

  const handleProximo = async () => {
    if (!validarEtapa()) return;
    const proximaEtapa = etapaIdx + 1;
    await salvarEtapa(respostas, proximaEtapa);
    setEtapaIdx(proximaEtapa);
  };

  const handleVoltar = () => {
    if (etapaIdx > 0) setEtapaIdx(etapaIdx - 1);
  };

  const handleFinalizar = async () => {
    if (!validarEtapa()) return;
    setSubmitting(true);
    const idSalvo = await salvarEtapa(respostas, etapaIdx + 1);
    const targetId = idSalvo ?? state.id;

    if (targetId) {
      const { data: ok, error: credErr } = await supabase.rpc('consumir_credito_diagnostico', {
        _diagnostico_id: targetId,
      });
      if (credErr || ok === false) {
        setSubmitting(false);
        toast({
          title: 'Sem diagnósticos disponíveis',
          description: 'Solicite um diagnóstico para continuar.',
          variant: 'destructive',
        });
        navigate('/comprar');
        return;
      }
    }

    const diagId = await finalizar();
    setSubmitting(false);
    if (diagId) {
      setRespostas({});
      setEtapaIdx(0);
      setAguardandoIA(diagId);
      setTimeout(() => {
        setAguardandoIA((cur) => {
          if (cur === diagId) {
            navigate(`/agendar/${diagId}`);
            return null;
          }
          return cur;
        });
      }, 8000);
    }
  };

  // Realtime: ouve status do diagnóstico e redireciona quando concluído
  useEffect(() => {
    if (!aguardandoIA) return;
    const channel = supabase
      .channel(`diag-${aguardandoIA}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'diagnosticos',
          filter: `id=eq.${aguardandoIA}`,
        },
        (payload) => {
          const status = (payload.new as { status?: string })?.status;
          if (status === 'concluido') {
            navigate(`/agendar/${aguardandoIA}`);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [aguardandoIA, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (aguardandoIA) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <h2 className="text-lg font-semibold">Processando seu diagnóstico…</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          A IA está analisando suas respostas. Você será redirecionado automaticamente assim que terminar.
        </p>
      </div>
    );
  }

  // Paywall: usuário sem créditos e sem rascunho em andamento
  if (!loading && !loadingCreditos && creditos === 0 && !state.id) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <h1 className="text-lg font-semibold">Diagnóstico de Negócio</h1>
            <UserAvatarMenu />
          </div>
        </header>
        <main className="container mx-auto max-w-xl px-4 py-16">
          <Card>
            <CardHeader className="items-center text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Solicite seu diagnóstico</CardTitle>
              <CardDescription>
                Você ainda não tem um diagnóstico disponível. Escolha um plano para liberar sua análise estratégica completa.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <Button asChild className="w-full">
                <Link to="/comprar">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Ver opções de diagnóstico
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/perfil">Voltar ao perfil</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const progresso = ((etapaIdx + 1) / etapas.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold">Diagnóstico de Negócio</h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <UserAvatarMenu />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Etapa {etapaIdx + 1} de {etapas.length}: {etapaAtual.titulo}
            </span>
            <span className="text-muted-foreground">
              {saving && (
                <>
                  <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                  Salvando…
                </>
              )}
              {!saving && state.id && (
                <>
                  <CheckCircle2 className="inline h-3 w-3 mr-1 text-primary" />
                  Rascunho salvo
                </>
              )}
            </span>
          </div>
          <Progress value={progresso} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{etapaAtual.titulo}</CardTitle>
            {etapaAtual.descricao && <CardDescription>{etapaAtual.descricao}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-6">
            {etapaAtual.perguntas.map((p) => (
              <PerguntaField
                key={p.id}
                pergunta={p}
                respostas={respostas}
                onChange={handleChange}
              />
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleVoltar}
            disabled={etapaIdx === 0 || submitting}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          {isUltima ? (
            <Button onClick={handleFinalizar} disabled={submitting || saving} className="flex-1">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Finalizar diagnóstico
            </Button>
          ) : (
            <Button onClick={handleProximo} disabled={saving} className="flex-1">
              Próximo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Diagnostico;
