import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatarMenu } from '@/components/UserAvatarMenu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DiagnosticoDetalhes,
  type DiagnosticoAnalise,
} from '@/components/admin/DiagnosticoDetalhes';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  CalendarCheck,
  FileDown,
  Loader2,
  Lock,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Trophy,
} from 'lucide-react';

interface DiagnosticoFull {
  id: string;
  user_id: string;
  status: string;
  empresa_nome: string | null;
  segmento: string | null;
  score: number | null;
  resumo_executivo: string | null;
  recomendacoes: unknown;
  analise: unknown;
  liberado_em: string | null;
  concluido_em: string | null;
  created_at: string;
  bloqueio_motivo?: string | null;
}

const DiagnosticoPremium = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['diagnostico-premium', id],
    enabled: !!id && !!user,
    queryFn: async (): Promise<DiagnosticoFull | null> => {
      const { data, error } = await supabase
        .from('diagnosticos')
        .select(
          'id, user_id, status, empresa_nome, segmento, score, resumo_executivo, recomendacoes, analise, liberado_em, concluido_em, created_at, bloqueio_motivo',
        )
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as DiagnosticoFull | null;
    },
  });

  // Busca dias de carência do PDF a partir do produto vinculado ao crédito do diagnóstico
  const { data: pdfMeta } = useQuery({
    queryKey: ['pdf-carencia', id],
    enabled: !!id && !!user && !!data,
    queryFn: async () => {
      const { data: cred } = await supabase
        .from('creditos_diagnostico')
        .select('created_at, produtos_pagamento:produto_id(pdf_disponivel_apos_dias)')
        .eq('diagnostico_id', id!)
        .maybeSingle();
      const dias =
        ((cred as { produtos_pagamento?: { pdf_disponivel_apos_dias?: number } | null } | null)
          ?.produtos_pagamento?.pdf_disponivel_apos_dias) ?? 7;
      return {
        compraEm: (cred as { created_at?: string } | null)?.created_at ?? null,
        dias,
      };
    },
  });

  // Bloqueia acesso se ainda não foi liberado OU se está bloqueado por estorno
  useEffect(() => {
    if (!data) return;
    if (data.status === 'bloqueado') {
      toast({
        title: 'Acesso ao diagnóstico bloqueado',
        description:
          data.bloqueio_motivo ?? 'Compra estornada/reembolsada. Entre em contato com o suporte.',
        variant: 'destructive',
      });
      navigate('/inicio', { replace: true });
      return;
    }
    const liberado = data.status === 'liberado' || data.status === 'concluido';
    if (!liberado) {
      toast({
        title: 'Diagnóstico ainda não liberado',
        description: 'Acompanhe o status na sua área inicial.',
      });
      navigate('/inicio', { replace: true });
    }
  }, [data, navigate, toast]);

  // Cálculo da carência do PDF
  const pdfReleaseDate = pdfMeta?.compraEm
    ? new Date(new Date(pdfMeta.compraEm).getTime() + (pdfMeta.dias ?? 7) * 86400000)
    : null;
  const pdfDisponivel = !pdfReleaseDate || pdfReleaseDate.getTime() <= Date.now();
  const diasRestantes = pdfReleaseDate
    ? Math.max(0, Math.ceil((pdfReleaseDate.getTime() - Date.now()) / 86400000))
    : 0;
  const pdfTooltipMsg = pdfDisponivel
    ? 'Baixar PDF do diagnóstico'
    : `Disponível em ${diasRestantes} dia${diasRestantes === 1 ? '' : 's'} (após período de garantia da compra)`;

  const handleDownloadPdf = async () => {
    if (!id) return;
    if (!pdfDisponivel) {
      toast({
        title: 'PDF ainda não disponível',
        description: pdfTooltipMsg,
      });
      return;
    }
    setGeneratingPdf(true);
    try {
      const { data: res, error } = await supabase.functions.invoke('gerar-pdf-diagnostico', {
        body: { diagnostico_id: id },
      });
      if (error) throw error;
      const url = (res as { signed_url?: string } | null)?.signed_url;
      if (!url) throw new Error('Sem URL de download');
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Falha no download (${resp.status})`);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `diagnostico-${data?.empresa_nome ?? id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      toast({ title: 'PDF baixado com sucesso' });
    } catch (e) {
      toast({
        title: 'Erro ao gerar PDF',
        description: e instanceof Error ? e.message : 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto space-y-4 px-4 py-12">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Diagnóstico não encontrado.</p>
          <Button asChild variant="link" className="mt-4">
            <Link to="/inicio">Voltar para o início</Link>
          </Button>
        </div>
      </div>
    );
  }

  const analise = (data.analise ?? data.recomendacoes ?? null) as DiagnosticoAnalise | null;
  const liberadoEm = data.liberado_em ?? data.concluido_em;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`Diagnóstico ${data.empresa_nome ?? ''} | Análise Estratégica`}</title>
        <meta
          name="description"
          content="Análise estratégica completa do seu negócio digital com SWOT, gargalos, recomendações priorizadas e roadmap de 365 dias."
        />
      </Helmet>

      {/* Topbar fixa */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/inicio">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
            >
              {generatingPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              Baixar PDF
            </Button>
            <UserAvatarMenu />
          </div>
        </div>
      </header>

      {/* Capa premium */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/15 via-primary/5 to-background">
        <div className="absolute inset-0 -z-10 opacity-50">
          <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="mx-auto max-w-4xl space-y-6 text-center">
            <Badge variant="outline" className="gap-1.5 border-primary/40 bg-background/60 backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Análise validada pela nossa equipe
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              Diagnóstico Estratégico
              {data.empresa_nome ? (
                <span className="block text-primary">{data.empresa_nome}</span>
              ) : null}
            </h1>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
              Mapeamos seu negócio em profundidade e desenhamos um plano de ação claro
              para os próximos 12 meses, com prioridades, KPIs e roadmap executável.
            </p>

            {/* Hero stats */}
            <div className="mx-auto grid max-w-3xl gap-3 pt-4 sm:grid-cols-3">
              <Card className="border-primary/20 bg-background/60 backdrop-blur">
                <CardContent className="space-y-1 p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                    <Trophy className="h-3.5 w-3.5" /> Score
                  </div>
                  <div className="text-3xl font-bold tabular-nums text-primary">
                    {data.score ?? '—'}
                    <span className="text-base font-normal text-muted-foreground">/100</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary/20 bg-background/60 backdrop-blur">
                <CardContent className="space-y-1 p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" /> Recomendações
                  </div>
                  <div className="text-3xl font-bold tabular-nums">
                    {(analise?.recomendacoes?.length ?? 0)}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary/20 bg-background/60 backdrop-blur">
                <CardContent className="space-y-1 p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" /> Liberado em
                  </div>
                  <div className="text-sm font-semibold">
                    {liberadoEm
                      ? new Date(liberadoEm).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 pt-4 sm:flex-row">
              <Button size="lg" onClick={handleDownloadPdf} disabled={generatingPdf}>
                {generatingPdf ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" />
                )}
                Baixar relatório em PDF
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to={`/agendar/${data.id}`}>
                  <CalendarCheck className="mr-2 h-4 w-4" /> Agendar reunião estratégica
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo principal */}
      <main className="container mx-auto max-w-5xl px-4 py-10 md:py-14">
        <DiagnosticoDetalhes
          resumoExecutivo={data.resumo_executivo}
          score={data.score}
          analise={analise}
        />

        {/* CTA final */}
        <section className="mt-12">
          <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
            <CardContent className="flex flex-col items-start justify-between gap-6 p-6 md:flex-row md:items-center md:p-10">
              <div className="max-w-xl">
                <h2 className="text-xl font-semibold md:text-2xl">
                  Pronto para colocar este plano em prática?
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Agende uma reunião estratégica com nosso time para destrinchar o roadmap,
                  priorizar a primeira execução e tirar dúvidas específicas do seu negócio.
                </p>
              </div>
              <Button asChild size="lg" className="shrink-0">
                <Link to={`/agendar/${data.id}`}>
                  <CalendarCheck className="mr-2 h-4 w-4" /> Agendar reunião
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default DiagnosticoPremium;