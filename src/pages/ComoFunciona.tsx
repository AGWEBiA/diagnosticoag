import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatarMenu } from '@/components/UserAvatarMenu';
import {
  ArrowRight,
  UserPlus,
  ClipboardList,
  BrainCircuit,
  ShieldCheck,
  FileText,
  CalendarCheck,
  LogIn,
  Database,
  Sparkles,
  Lock,
  CheckCircle2,
} from 'lucide-react';

const etapas = [
  {
    n: '01',
    icon: UserPlus,
    titulo: 'Cadastro e ativação de créditos',
    descricao:
      'Crie sua conta com email e senha. Compras realizadas via Hotmart ou Kiwify (com o mesmo email) são automaticamente vinculadas e creditadas na sua conta — inclusive retroativamente.',
    detalhes: [
      'Verificação de email obrigatória',
      'Senha forte com indicador visual',
      'Créditos vinculados por email do comprador',
    ],
  },
  {
    n: '02',
    icon: ClipboardList,
    titulo: 'Formulário em 5 etapas',
    descricao:
      'Responda perguntas estruturadas sobre seu negócio. O formulário é dividido em etapas curtas com auto-save: você pode parar e retomar de onde parou a qualquer momento.',
    detalhes: [
      'Etapa 1: nicho de atuação',
      'Etapa 2: perguntas universais (faturamento, equipe, canais)',
      'Etapa 3: metas e projeções',
      'Etapa 4: estratégias atuais',
      'Etapa 5: perguntas específicas do seu nicho',
    ],
  },
  {
    n: '03',
    icon: BrainCircuit,
    titulo: 'Análise com IA vertical + RAG',
    descricao:
      'Ao finalizar, 1 crédito é consumido atomicamente e nossa engine de IA processa suas respostas. Usamos RAG (Retrieval Augmented Generation) com base de conhecimento curada para evitar alucinações.',
    detalhes: [
      'Busca semântica via pgvector na knowledge_base',
      'Modelos: Gemini 2.5 e GPT-5 com fallback',
      'Pontuação de confiança por análise',
      'Trilha de auditoria completa (audit_trail_ia)',
    ],
  },
  {
    n: '04',
    icon: FileText,
    titulo: 'Relatório executivo em PDF',
    descricao:
      'Geramos um relatório profissional contendo resumo executivo, score de maturidade, recomendações priorizadas para os próximos 90 dias e plano de ação acionável.',
    detalhes: [
      'PDF armazenado com versionamento',
      'Score de maturidade do negócio',
      'Recomendações ranqueadas por impacto',
      'Fontes do RAG referenciadas',
    ],
  },
  {
    n: '05',
    icon: CalendarCheck,
    titulo: 'Reunião de entrega',
    descricao:
      'Agende uma reunião comigo para apresentação completa do diagnóstico, esclarecimento de dúvidas e discussão do plano de ação. O PDF fica disponível na sua área logada.',
    detalhes: [
      'Agendamento direto pela plataforma',
      'Apresentação ao vivo do relatório',
      'Discussão do plano de execução',
    ],
  },
];

const pilares = [
  {
    icon: ShieldCheck,
    titulo: 'Anti-alucinação',
    descricao:
      'Cada análise é grounded em conhecimento verificado. Pontuação de confiança e flags automáticos para revisão.',
  },
  {
    icon: Database,
    titulo: 'Auditoria completa',
    descricao:
      'Todo prompt, resposta, contexto RAG e custo de IA é registrado. Trilha completa para compliance.',
  },
  {
    icon: Lock,
    titulo: 'Segurança por padrão',
    descricao:
      'Row-Level Security em todas as tabelas, roles separadas, autenticação robusta com verificação de email.',
  },
  {
    icon: Sparkles,
    titulo: 'IA vertical especializada',
    descricao:
      'Não é um ChatGPT genérico. Conhecimento curado para negócios digitais, nichos específicos.',
  },
];

const ComoFunciona = () => {
  const { user } = useAuth();
  const ctaTo = user ? '/diagnostico' : '/login';
  const ctaLabel = user ? 'Iniciar meu diagnóstico' : 'Entrar';

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Como funciona | Diagnóstico de Negócios Digitais com IA</title>
        <meta
          name="description"
          content="Entenda o fluxo completo do diagnóstico: cadastro, formulário em 5 etapas, análise com IA vertical e RAG, relatório PDF e reunião de entrega."
        />
        <link rel="canonical" href={`${window.location.origin}/como-funciona`} />
      </Helmet>

      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="font-semibold">
            Diagnóstico IA
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/como-funciona">Como funciona</Link>
            </Button>
            {user ? (
              <>
                <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
                  <Link to="/diagnostico">
                    Meu diagnóstico <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <UserAvatarMenu />
              </>
            ) : (
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Entrar
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Fluxo end-to-end auditável
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Como funciona o diagnóstico
            </h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              Do cadastro à reunião de entrega — entenda cada etapa do nosso processo de
              análise estratégica com IA vertical.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to={ctaTo}>
                  {ctaLabel} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#fluxo">Ver as 5 etapas</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Timeline / Fluxo */}
        <section id="fluxo" className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold md:text-3xl">As 5 etapas do fluxo</h2>
              <p className="mt-2 text-muted-foreground">
                Pensado para ser simples para você e robusto por dentro.
              </p>
            </div>

            <ol className="mx-auto mt-12 max-w-4xl space-y-6">
              {etapas.map((etapa, idx) => (
                <li key={etapa.n} className="relative">
                  <Card className="overflow-hidden">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex flex-col gap-6 md:flex-row md:items-start">
                        <div className="flex shrink-0 items-center gap-4 md:flex-col md:items-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <etapa.icon className="h-6 w-6" />
                          </div>
                          <span className="font-mono text-sm font-bold text-muted-foreground">
                            {etapa.n}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold">{etapa.titulo}</h3>
                          <p className="mt-2 text-muted-foreground">{etapa.descricao}</p>
                          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                            {etapa.detalhes.map((d) => (
                              <li
                                key={d}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                              >
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <span>{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {idx < etapas.length - 1 && (
                    <div className="my-2 flex justify-center">
                      <ArrowRight className="h-5 w-5 rotate-90 text-muted-foreground/40" />
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pilares enterprise */}
        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold md:text-3xl">
              Por dentro: nossos pilares enterprise
            </h2>
            <p className="mt-2 text-muted-foreground">
              O que diferencia uma análise com IA vertical de um ChatGPT genérico.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {pilares.map((p) => (
              <Card key={p.titulo}>
                <CardContent className="p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{p.titulo}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.descricao}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ rápido */}
        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-center text-2xl font-bold md:text-3xl">
                Perguntas frequentes
              </h2>
              <div className="mt-8 space-y-4">
                {[
                  {
                    q: 'Como adquiro créditos para fazer um diagnóstico?',
                    a: 'Os créditos são adquiridos via Hotmart ou Kiwify e ficam automaticamente vinculados à sua conta pelo email utilizado na compra.',
                  },
                  {
                    q: 'Posso pausar o formulário e voltar depois?',
                    a: 'Sim. Cada etapa é salva automaticamente. Você pode fechar a aba e retomar exatamente de onde parou ao fazer login novamente.',
                  },
                  {
                    q: 'Como vocês evitam alucinação da IA?',
                    a: 'Usamos RAG com base de conhecimento curada e validada manualmente, pontuação de confiança por análise e trilha de auditoria de todo prompt e resposta.',
                  },
                  {
                    q: 'O relatório é entregue na hora?',
                    a: 'A análise é gerada em minutos e o PDF fica disponível na sua área logada. A entrega completa acontece em uma reunião comigo, agendada pela plataforma.',
                  },
                ].map((item) => (
                  <Card key={item.q}>
                    <CardContent className="p-6">
                      <h3 className="font-semibold">{item.q}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
            <CardContent className="p-8 md:p-12">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold md:text-4xl">
                  Pronto para o seu diagnóstico?
                </h2>
                <p className="mt-3 text-muted-foreground md:text-lg">
                  Crie sua conta e dê o primeiro passo para uma análise estratégica
                  profunda do seu negócio digital.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button asChild size="lg">
                    <Link to={ctaTo}>
                      {ctaLabel} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  {!user && (
                    <Button asChild size="lg" variant="outline">
                      <Link to="/login">Já tenho conta</Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Diagnóstico IA</span>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-foreground">
              Início
            </Link>
            <Link to="/como-funciona" className="hover:text-foreground">
              Como funciona
            </Link>
            <Link to="/login" className="hover:text-foreground">
              Entrar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ComoFunciona;
