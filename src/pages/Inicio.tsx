import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useCreditos } from '@/hooks/useCreditos';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatarMenu } from '@/components/UserAvatarMenu';
import {
  ArrowRight,
  ClipboardList,
  CalendarCheck,
  FileText,
  ShoppingCart,
  Sparkles,
  PlayCircle,
  CheckCircle2,
  Clock,
  Target,
} from 'lucide-react';
import { TOTAL_ETAPAS } from '@/config/diagnosticoSchema';

interface DiagnosticoResumo {
  id: string;
  status: 'rascunho' | 'em_analise' | 'concluido' | 'arquivado';
  empresa_nome: string | null;
  segmento: string | null;
  score: number | null;
  resumo_executivo: string | null;
  created_at: string;
  updated_at: string;
  concluido_em: string | null;
  respostas: Record<string, unknown> | null;
}

const STATUS_LABEL: Record<DiagnosticoResumo['status'], string> = {
  rascunho: 'Em preenchimento',
  em_analise: 'Em análise',
  concluido: 'Concluído',
  arquivado: 'Arquivado',
};

const STATUS_VARIANT: Record<DiagnosticoResumo['status'], 'default' | 'secondary' | 'outline'> = {
  rascunho: 'secondary',
  em_analise: 'outline',
  concluido: 'default',
  arquivado: 'outline',
};

const Inicio = () => {
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const { creditos, loading: loadingCreditos } = useCreditos();

  const { data: diagnosticos, isLoading: loadingDiag } = useQuery({
    queryKey: ['diagnosticos-inicio', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<DiagnosticoResumo[]> => {
      const { data, error } = await supabase
        .from('diagnosticos')
        .select('id, status, empresa_nome, segmento, score, resumo_executivo, created_at, updated_at, concluido_em, respostas')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as DiagnosticoResumo[];
    },
  });

  const ativo = diagnosticos?.[0];
  const concluido = diagnosticos?.find((d) => d.status === 'concluido');
  const emAnalise = diagnosticos?.find((d) => d.status === 'em_analise');
  const rascunho = diagnosticos?.find((d) => d.status === 'rascunho');

  // Progresso do rascunho
  const etapaAtual =
    rascunho?.respostas && typeof (rascunho.respostas as Record<string, unknown>).__etapa_atual === 'number'
      ? ((rascunho.respostas as Record<string, unknown>).__etapa_atual as number)
      : 0;
  const progressoPct = Math.min(100, Math.round((etapaAtual / TOTAL_ETAPAS) * 100));

  const nome = profile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? '';

  // Próxima ação principal
  const proxima = (() => {
    if (concluido) {
      return {
        titulo: 'Agende sua reunião de entrega',
        descricao: 'Seu diagnóstico está pronto. Agende um horário para revisarmos juntos.',
        cta: 'Agendar reunião',
        to: `/agendar/${concluido.id}`,
        icon: CalendarCheck,
      };
    }
    if (emAnalise) {
      return {
        titulo: 'Análise em andamento',
        descricao: 'Estamos processando suas respostas com IA. Isso costuma levar poucos minutos.',
        cta: 'Ver status',
        to: '/diagnostico',
        icon: Sparkles,
      };
    }
    if (rascunho) {
      return {
        titulo: 'Continue de onde parou',
        descricao: `Você está na etapa ${Math.min(etapaAtual + 1, TOTAL_ETAPAS)} de ${TOTAL_ETAPAS}.`,
        cta: 'Retomar diagnóstico',
        to: '/diagnostico',
        icon: PlayCircle,
      };
    }
    if (creditos > 0) {
      return {
        titulo: 'Comece seu diagnóstico',
        descricao: 'Você tem créditos disponíveis. Em poucos minutos por etapa, mapeamos seu negócio.',
        cta: 'Iniciar diagnóstico',
        to: '/diagnostico',
        icon: ClipboardList,
      };
    }
    return {
      titulo: 'Adquira um diagnóstico',
      descricao: 'Compre um plano e libere a análise estratégica do seu negócio.',
      cta: 'Ver planos',
      to: '/comprar',
      icon: ShoppingCart,
    };
  })();

  const ProximaIcon = proxima.icon;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Início | Diagnóstico de Negócios Digitais</title>
        <meta name="description" content="Sua área pessoal: resumo do diagnóstico, créditos e próximos passos." />
      </Helmet>

      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/inicio" className="font-semibold">
            Diagnóstico IA
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/como-funciona">Como funciona</Link>
            </Button>
            <UserAvatarMenu />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Saudação */}
        <section className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Olá{nome ? `, ${nome}` : ''} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            Aqui está o resumo da sua conta e os próximos passos.
          </p>
        </section>

        {/* Próxima ação destacada */}
        <Card className="mb-8 overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <ProximaIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{proxima.titulo}</h2>
                <p className="mt-1 text-muted-foreground">{proxima.descricao}</p>
              </div>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link to={proxima.to}>
                {proxima.cta} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Stats: créditos + último diagnóstico */}
        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Créditos disponíveis
              </CardDescription>
              <CardTitle className="text-3xl">
                {loadingCreditos ? <Skeleton className="h-9 w-12" /> : creditos}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/comprar">
                  <ShoppingCart className="mr-2 h-4 w-4" /> Adquirir mais
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Target className="h-4 w-4" /> Status atual
              </CardDescription>
              <CardTitle className="text-xl">
                {loadingDiag ? (
                  <Skeleton className="h-7 w-32" />
                ) : ativo ? (
                  <Badge variant={STATUS_VARIANT[ativo.status]}>{STATUS_LABEL[ativo.status]}</Badge>
                ) : (
                  <span className="text-muted-foreground">Nenhum diagnóstico</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {ativo?.empresa_nome ?? 'Sem empresa informada ainda'}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Score de maturidade
              </CardDescription>
              <CardTitle className="text-3xl">
                {loadingDiag ? (
                  <Skeleton className="h-9 w-16" />
                ) : concluido?.score != null ? (
                  <span>
                    {concluido.score}
                    <span className="text-base font-normal text-muted-foreground">/100</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Disponível após a análise
            </CardContent>
          </Card>
        </section>

        {/* Resumo do diagnóstico ativo */}
        {ativo && (
          <section className="mb-8 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Seu diagnóstico</CardTitle>
                <CardDescription>
                  {ativo.empresa_nome ?? 'Diagnóstico em andamento'}
                  {ativo.segmento ? ` · ${ativo.segmento}` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ativo.status === 'rascunho' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">
                        Etapa {Math.min(etapaAtual + 1, TOTAL_ETAPAS)} de {TOTAL_ETAPAS}
                      </span>
                    </div>
                    <Progress value={progressoPct} />
                  </div>
                )}
                {ativo.status === 'em_analise' && (
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>
                      Sua análise está sendo processada. Você receberá uma notificação quando estiver pronta.
                    </span>
                  </div>
                )}
                {ativo.status === 'concluido' && ativo.resumo_executivo && (
                  <div>
                    <h3 className="text-sm font-semibold">Resumo executivo</h3>
                    <p className="mt-2 line-clamp-5 text-sm text-muted-foreground">
                      {ativo.resumo_executivo}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Atalhos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Atalhos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/diagnostico">
                    <ClipboardList className="mr-2 h-4 w-4" /> Meu diagnóstico
                  </Link>
                </Button>
                {concluido && (
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to={`/agendar/${concluido.id}`}>
                      <CalendarCheck className="mr-2 h-4 w-4" /> Agendar reunião
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/comprar">
                    <ShoppingCart className="mr-2 h-4 w-4" /> Comprar créditos
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/perfil">
                    <FileText className="mr-2 h-4 w-4" /> Meu perfil
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Histórico */}
        {diagnosticos && diagnosticos.length > 1 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Histórico</h2>
            <div className="space-y-2">
              {diagnosticos.slice(1).map((d) => (
                <Card key={d.id}>
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">
                          {d.empresa_nome ?? 'Diagnóstico sem nome'}
                        </span>
                        <Badge variant={STATUS_VARIANT[d.status]} className="shrink-0">
                          {STATUS_LABEL[d.status]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Atualizado em {new Date(d.updated_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {d.status === 'concluido' && (
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/agendar/${d.id}`}>
                          Ver <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Inicio;