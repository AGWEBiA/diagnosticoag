import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowLeft, RefreshCw, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Recomendacao {
  titulo: string;
  descricao: string;
  prioridade: 'alta' | 'media' | 'baixa';
  categoria: string;
  impacto_estimado: string;
}

interface RagItem {
  titulo: string;
  conteudo: string;
  categoria: string | null;
  similarity: number;
}

interface Diagnostico {
  id: string;
  status: string;
  segmento: string | null;
  empresa_nome: string | null;
  resumo_executivo: string | null;
  recomendacoes: Recomendacao[] | null;
  score: number | null;
  confianca_score: number | null;
  rag_contexto: RagItem[] | null;
  concluido_em: string | null;
  created_at: string;
}

const prioridadeVariant: Record<Recomendacao['prioridade'], 'default' | 'secondary' | 'outline'> = {
  alta: 'default',
  media: 'secondary',
  baixa: 'outline',
};

const Resultado = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [diag, setDiag] = useState<Diagnostico | null>(null);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);

  const carregar = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('diagnosticos')
      .select(
        'id, status, segmento, empresa_nome, resumo_executivo, recomendacoes, score, confianca_score, rag_contexto, concluido_em, created_at',
      )
      .eq('id', id)
      .maybeSingle();
    setLoading(false);

    if (error || !data) {
      toast({
        title: 'Não encontrado',
        description: error?.message ?? 'Diagnóstico inexistente',
        variant: 'destructive',
      });
      return;
    }
    setDiag(data as unknown as Diagnostico);
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const reprocessar = async () => {
    if (!id) return;
    setReprocessing(true);
    const { error } = await supabase.functions.invoke('process-diagnostico', {
      body: { diagnostico_id: id },
    });
    setReprocessing(false);
    if (error) {
      toast({
        title: 'Erro ao processar',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'Processamento concluído' });
    carregar();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!diag) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Diagnóstico não encontrado</CardTitle>
            <CardDescription>Verifique o link ou crie um novo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/diagnostico">Voltar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isConcluido = diag.status === 'concluido';
  const isEmAnalise = diag.status === 'em_analise';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/diagnostico')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Resultado do diagnóstico</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          {!isConcluido && (
            <Button size="sm" onClick={reprocessar} disabled={reprocessing}>
              {reprocessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Processar análise IA
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Status banner */}
        {isEmAnalise && !diag.resumo_executivo && (
          <Card className="border-dashed">
            <CardContent className="flex items-center gap-3 pt-6">
              <Sparkles className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Análise pendente</p>
                <p className="text-sm text-muted-foreground">
                  Clique em "Processar análise IA" para gerar o relatório.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{diag.empresa_nome || 'Diagnóstico'}</CardTitle>
                <CardDescription>
                  Segmento: {diag.segmento ?? '—'} · Status:{' '}
                  <Badge variant={isConcluido ? 'default' : 'secondary'}>{diag.status}</Badge>
                </CardDescription>
              </div>
              {diag.score !== null && (
                <div className="text-right">
                  <div className="text-3xl font-bold">{diag.score}/100</div>
                  <div className="text-xs text-muted-foreground">Score de maturidade</div>
                </div>
              )}
            </div>
          </CardHeader>
          {diag.score !== null && (
            <CardContent>
              <Progress value={diag.score} className="h-2" />
              {diag.confianca_score !== null && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  {diag.confianca_score < 0.5 ? (
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                  )}
                  Confiança da análise: {(diag.confianca_score * 100).toFixed(0)}%
                </p>
              )}
            </CardContent>
          )}
        </Card>

        {/* Resumo */}
        {diag.resumo_executivo && (
          <Card>
            <CardHeader>
              <CardTitle>Resumo executivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
                {diag.resumo_executivo}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recomendações */}
        {diag.recomendacoes && diag.recomendacoes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recomendações priorizadas</CardTitle>
              <CardDescription>{diag.recomendacoes.length} ações recomendadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {diag.recomendacoes.map((r, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold">
                      {i + 1}. {r.titulo}
                    </h3>
                    <Badge variant={prioridadeVariant[r.prioridade]}>{r.prioridade}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.descricao}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">{r.categoria}</Badge>
                    <span className="text-muted-foreground">
                      Impacto: {r.impacto_estimado}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* RAG sources */}
        {diag.rag_contexto && diag.rag_contexto.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fontes consultadas</CardTitle>
              <CardDescription>
                Conteúdo verificado da base de conhecimento usado na análise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {diag.rag_contexto.map((c, i) => (
                <div key={i} className="text-sm border-l-2 border-primary pl-3">
                  <div className="font-medium">{c.titulo}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.categoria ?? 'geral'} · similaridade {(c.similarity * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Resultado;
