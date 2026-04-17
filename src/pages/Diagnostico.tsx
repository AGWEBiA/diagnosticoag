import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Pergunta, getEtapasPorSegmento, TOTAL_ETAPAS } from '@/config/diagnosticoSchema';
import { PerguntaField } from '@/components/diagnostico/PerguntaField';
import { useDiagnosticoRascunho, Respostas } from '@/hooks/useDiagnosticoRascunho';
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
    await salvarEtapa(respostas, etapaIdx + 1);
    const diagId = await finalizar();
    setSubmitting(false);
    if (diagId) {
      setRespostas({});
      setEtapaIdx(0);
      navigate(`/agendar/${diagId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <div className="flex items-center gap-2">
            {hasRole('admin') && (
              <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                <Shield className="mr-2 h-4 w-4" />
                Admin
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
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
