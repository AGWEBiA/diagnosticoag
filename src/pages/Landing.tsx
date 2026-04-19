import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { UserAvatarMenu } from '@/components/UserAvatarMenu';
import { YouTubeLite } from '@/components/YouTubeLite';
import andersonPortrait from '@/assets/anderson-portrait.jpg';
import {
  ArrowRight,
  LogIn,
  Check,
  X,
  Star,
  ShieldCheck,
  Clock,
  Target,
  TrendingUp,
  Award,
  Users,
  FileText,
  Zap,
  Building2,
  GraduationCap,
  Lightbulb,
  Video,
  AlertTriangle,
  Sparkles,
  DollarSign,
  
  BookOpen,
  Briefcase,
} from 'lucide-react';

const TESTIMONIALS = [
  {
    videoId: 'QaFabNdcbd0',
    name: 'Anderson Maisse',
    role: 'Contador e CEO da AM Contabilidade',
    quote:
      'Identifiquei que estava gastando 60% do meu orçamento em um canal que rendia apenas 10%. Redirecionei e meu faturamento cresceu 3x em 3 meses.',
  },
  {
    videoId: '88fQ3R35CuY',
    name: 'Andreza Emerick',
    role: 'Contadora',
    quote:
      'O relatório foi tão preciso que parecia que Anderson tinha passado um mês dentro da minha empresa. Cada recomendação foi exatamente o que eu precisava ouvir.',
  },
  {
    videoId: 'DOfdl5OwADY',
    name: 'Anderson Souza',
    role: 'Contador e Mentor',
    quote:
      'Foi a melhor decisão que tomei. A reunião com Anderson me deu clareza sobre o que fazer nos próximos 12 meses. Já implementei 3 recomendações e estou vendo resultado.',
  },
  {
    videoId: 'hcPxFHwaDY8',
    name: 'Bruno Nascimento',
    role: 'Contador e CEO da AJ Contabilidade',
    quote:
      'Recomendo para todo empreendedor digital que quer crescer. Não é um gasto, é um investimento que retorna em dias.',
  },
  {
    videoId: 'RDnGb3_7gFk',
    name: 'Marta Giove',
    role: 'CEO do Grupo DPG',
    quote:
      'Saí da reunião com um plano executável. Em poucas semanas já estava colhendo os primeiros resultados das mudanças propostas.',
  },
  {
    videoId: 'Bb7ZBSonozo',
    name: 'Matheus Simões',
    role: 'Diretor Nacional de Educação do SENAI',
    quote:
      'A análise mostrou exatamente onde eu estava perdendo dinheiro e qual o próximo passo. Direto ao ponto, sem enrolação.',
  },
] as const;


const Landing = () => {
  const { user } = useAuth();
  const ctaHref = user ? '/comprar' : '/signup';

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Diagnóstico de Negócios Digitais | Anderson Gomes</title>
        <meta
          name="description"
          content="Descubra os GARGALOS REAIS do seu negócio digital e saiba EXATAMENTE o que fazer para crescer. Análise com IA Proprietária + Equipe de Especialistas + 10+ anos gerenciando +R$ 40 milhões em resultados."
        />
        <link rel="canonical" href={`${window.location.origin}/`} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Diagnóstico de Negócios Digitais',
            description:
              'Análise estratégica do seu negócio digital com IA vertical: identificação de gargalos, plano de ação priorizado e relatório executivo em PDF.',
            provider: { '@type': 'Person', name: 'Anderson Gomes' },
            areaServed: 'BR',
            offers: [
              { '@type': 'Offer', name: 'Diagnóstico Rápido', price: '197', priceCurrency: 'BRL' },
              { '@type': 'Offer', name: 'Diagnóstico Completo', price: '297', priceCurrency: 'BRL' },
            ],
          })}
        </script>
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="font-semibold">Anderson Gomes</Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/como-funciona">Como funciona</Link>
            </Button>
            {user ? (
              <>
                <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
                  <Link to="/diagnostico">Meu diagnóstico <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <UserAvatarMenu />
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login"><LogIn className="mr-2 h-4 w-4" /> Entrar</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/signup">Criar conta</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden border-b">
          {/* Background com gradient + grid pattern sutil */}
          <div className="absolute inset-0 -z-10 bg-gradient-subtle" />
          <div
            className="absolute inset-0 -z-10 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
              maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
            }}
          />
          {/* Glow orbs decorativos */}
          <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

          <div className="container mx-auto px-4 py-20 md:py-28">
            <div className="mx-auto max-w-4xl text-center">
              <Badge
                variant="secondary"
                className="mb-6 border border-primary/20 bg-primary/5 px-4 py-1.5 text-primary shadow-soft backdrop-blur"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Análise estratégica com IA Proprietária + Equipe de Especialistas
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
                Descubra os{' '}
                <span className="bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-transparent">
                  GARGALOS REAIS
                </span>{' '}
                do seu negócio digital
              </h1>
              <p className="mt-6 text-xl font-medium text-muted-foreground md:text-2xl">
                E saiba <span className="font-semibold text-foreground">EXATAMENTE</span> o que fazer para crescer
              </p>
              <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
                Análise profunda com IA Proprietária + Equipe de Especialistas + estratégia personalizada baseada em{' '}
                <strong className="text-foreground">10+ anos</strong> de experiência gerenciando{' '}
                <strong className="text-foreground">+R$ 40 milhões</strong> em resultados digitais.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-gradient-primary shadow-glow transition-smooth hover:shadow-elevated sm:w-auto"
                >
                  <a href="#produtos">
                    Quero descobrir meus gargalos <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full border-primary/20 backdrop-blur transition-smooth hover:bg-primary/5 sm:w-auto"
                >
                  <Link to="/como-funciona">Como funciona</Link>
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-3 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-muted-foreground shadow-soft backdrop-blur">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Garantia de 7 dias
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-muted-foreground shadow-soft backdrop-blur">
                  <Clock className="h-4 w-4 text-primary" /> Entrega em até 5 dias
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-muted-foreground shadow-soft backdrop-blur">
                  <Award className="h-4 w-4 text-primary" /> +R$ 40 milhões gerenciados
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEMA + SOLUÇÃO */}
        <section className="border-b py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Você está deixando dinheiro na mesa.
              </h2>
              <div className="mt-6 space-y-4 text-lg text-muted-foreground">
                <p>Pode parecer duro, mas é a verdade que a maioria dos empreendedores digitais não quer ouvir.</p>
                <p>
                  Você tem um negócio, tem tráfego, tem clientes... mas algo não está clicando. Seu faturamento
                  não cresce como deveria. Sua margem de lucro é menor que a dos concorrentes. E você não sabe
                  exatamente onde está o problema.
                </p>
                <p>
                  E o pior? Você está tentando resolver isso sozinho, testando estratégias aleatórias, gastando
                  tempo e dinheiro sem saber se está no caminho certo.
                </p>
                <p className="text-foreground">
                  Depois de 10+ anos no mercado, gerenciando mais de <strong>R$ 40 milhões</strong> em resultados
                  digitais e atendendo empresas como SENAI, Coca-Cola e Grupo Jovem Pan, descobri algo que muda tudo:
                </p>
                <blockquote className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-elevated md:p-8">
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-primary" />
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
                  <p className="text-lg font-semibold leading-relaxed text-foreground md:text-xl">
                    A maioria dos negócios digitais falha não porque a estratégia é ruim, mas porque ninguém fez
                    um <span className="text-primary">DIAGNÓSTICO PROFUNDO</span> antes de agir.
                  </p>
                </blockquote>
                <p>
                  É como tentar consertar um carro sem saber o que está quebrado. Você pode gastar uma fortuna em
                  peças e nunca resolver o problema.
                </p>
                <p className="text-foreground">
                  Mas se você souber EXATAMENTE qual é o problema, tiver um PLANO CLARO de ação e souber PARA
                  ONDE IR... aí sim, as coisas mudam.
                </p>
                <p>
                  Por isso criei o <strong className="text-foreground">Diagnóstico de Negócios Digitais</strong>:
                  análise profunda e personalizada do seu negócio com IA Proprietária + Equipe de Especialistas, conhecimento de 10+
                  anos no mercado, metodologia testada com centenas de clientes e recomendações acionáveis (não teóricas).
                </p>
                <p className="text-foreground">
                  Você sai com um <strong>plano claro de ação para os próximos 90, 180 e 365 dias</strong>.
                  Sem mais dúvidas. Sem mais incertezas. Só clareza e direção.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUTOS */}
        <section id="produtos" className="border-b bg-muted/30 py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Qual é o seu próximo passo?</h2>
              <p className="mt-3 text-muted-foreground">Escolha a opção que melhor se encaixa no seu momento.</p>
            </div>

            <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-2">
              {/* Diagnóstico Rápido */}
              <Card className="flex flex-col">
                <CardContent className="flex flex-1 flex-col p-8">
                  <div className="mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-bold">Diagnóstico Rápido</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Análise profunda + relatório em PDF</p>
                  <div className="my-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-muted-foreground">Investimento:</span>
                      <span className="text-4xl font-bold">R$ 197</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                      <Clock className="h-3 w-3" /> Entrega em 48 horas
                    </div>
                  </div>

                  <p className="mb-3 text-sm font-semibold">📋 O que você recebe:</p>
                  <ul className="space-y-2.5 text-sm">
                    {[
                      'Análise profunda com IA Proprietária + Equipe de Especialistas',
                      'Avaliação completa dos 5 pilares do negócio',
                      'Relatório em PDF de 15+ páginas (design profissional)',
                      'Score de saúde do negócio (0–100)',
                      'Classificação em quadrantes',
                      'Plano de ação para 30, 90 e 365 dias',
                      'Análise de estratégias e ROI',
                      'Identificação de oportunidades (upsell, cross-sell, novos canais)',
                    ].map((item) => (
                      <li key={item} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 rounded-lg border border-dashed bg-muted/40 p-4 text-xs">
                    <p className="font-semibold text-foreground">Ideal para:</p>
                    <p className="mt-1 text-muted-foreground">
                      Quem quer clareza rápido, tem orçamento limitado, prefere autonomia ou quer validar ideias.
                    </p>
                    <p className="mt-3 flex items-start gap-1.5 font-semibold text-foreground">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Limitação:
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Você recebe o relatório, mas sem reunião de direcionamento, pode ter dúvidas sobre como executar.
                    </p>
                  </div>

                  <div className="mt-6">
                    <Button asChild size="lg" variant="outline" className="w-full">
                      <Link to={ctaHref}>👉 Contratar Diagnóstico Rápido</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Diagnóstico Completo */}
              <Card className="relative flex flex-col border-primary shadow-lg">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="px-3 py-1">
                    <Star className="mr-1 h-3 w-3" /> Mais escolhido
                  </Badge>
                </div>
                <CardContent className="flex flex-1 flex-col p-8">
                  <div className="mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-bold">Diagnóstico Completo + Reunião</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Análise + relatório + reunião 1:1 com Anderson Gomes
                  </p>
                  <div className="my-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-muted-foreground">Investimento:</span>
                      <span className="text-4xl font-bold">R$ 297</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                      <Clock className="h-3 w-3" /> Entrega em 5 dias úteis
                    </div>
                  </div>

                  <p className="mb-3 text-sm font-semibold">📋 Tudo do plano rápido, mais:</p>
                  <ul className="space-y-2.5 text-sm">
                    {[
                      'Reunião 1:1 de 60 minutos com Anderson Gomes',
                      'Direcionamento estratégico (prioridades + roadmap)',
                      'Identificação de quick wins (resultado rápido)',
                      'Resposta a perguntas específicas do seu negócio',
                      'Acesso a recursos exclusivos (templates, checklists, fornecedores)',
                      'Suporte por 30 dias por email',
                    ].map((item) => (
                      <li key={item} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 rounded-lg border border-dashed bg-primary/5 p-4 text-xs">
                    <p className="font-semibold text-foreground">Ideal para:</p>
                    <p className="mt-1 text-muted-foreground">
                      Quem quer garantia de resultado, precisa de orientação prática, quer implementar rápido ou
                      tem negócio em estágio crítico.
                    </p>
                    <p className="mt-3 flex items-start gap-1.5 font-semibold text-foreground">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> Diferencial:
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Você não recebe só um relatório. Recebe um <strong className="text-foreground">plano executável</strong> e
                      o acompanhamento para começar hoje.
                    </p>
                  </div>

                  <div className="mt-6">
                    <Button asChild size="lg" className="w-full">
                      <Link to={ctaHref}>👉 Contratar Diagnóstico Completo</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comparativo */}
            <div className="mx-auto mt-16 max-w-4xl">
              <h3 className="mb-6 text-center text-2xl font-bold">Comparação lado a lado</h3>
              <div className="overflow-hidden rounded-lg border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-4 text-left font-semibold">Recurso</th>
                      <th className="p-4 text-center font-semibold">Rápido<div className="text-xs font-normal text-muted-foreground">R$ 197</div></th>
                      <th className="p-4 text-center font-semibold">Completo<div className="text-xs font-normal text-muted-foreground">R$ 297</div></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { f: 'Análise com IA Proprietária + Equipe de Especialistas', r: true, c: true },
                      { f: 'Relatório com 15+ páginas em PDF', r: true, c: true },
                      { f: 'Score de saúde do negócio', r: true, c: true },
                      { f: 'Plano de ação 30/90/365 dias', r: true, c: true },
                      { f: 'Análise de estratégias e ROI', r: true, c: true },
                      { f: 'Reunião 1:1 com Anderson (60 min)', r: false, c: true },
                      { f: 'Direcionamento estratégico', r: false, c: true },
                      { f: 'Quick wins identificados', r: false, c: true },
                      { f: 'Resposta a perguntas específicas', r: false, c: true },
                      { f: 'Suporte por 30 dias', r: false, c: true },
                    ].map((row, i) => (
                      <tr key={row.f} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                        <td className="p-4">{row.f}</td>
                        <td className="p-4 text-center">
                          {row.r ? <Check className="mx-auto h-5 w-5 text-primary" /> : <X className="mx-auto h-5 w-5 text-muted-foreground/50" />}
                        </td>
                        <td className="p-4 text-center">
                          {row.c ? <Check className="mx-auto h-5 w-5 text-primary" /> : <X className="mx-auto h-5 w-5 text-muted-foreground/50" />}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t bg-muted/40">
                      <td className="p-4 font-semibold">Tempo de entrega</td>
                      <td className="p-4 text-center font-medium">48 horas</td>
                      <td className="p-4 text-center font-medium">5 dias úteis</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* AUTORIDADE */}
        <section className="border-b py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Por que você deveria confiar em mim?
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                  Não sou um "guru" de internet que vende ilusões. Sou um profissional com{' '}
                  <strong className="text-foreground">10+ anos</strong> de experiência real no mercado.
                </p>
                <p className="mt-2 font-semibold text-foreground">Aqui estão os números:</p>
              </div>

              <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    icon: TrendingUp,
                    n: '+R$ 40 milhões',
                    t: 'em resultados gerenciados',
                    d: 'Não em teoria. Em resultados reais de clientes.',
                  },
                  {
                    icon: Building2,
                    n: 'SENAI · Coca-Cola · Jovem Pan',
                    t: 'entre as marcas atendidas',
                    d: 'Confiam na minha estratégia e metodologia.',
                  },
                  {
                    icon: Users,
                    n: 'Centenas de clientes',
                    t: 'experts, infoprodutores, agências e consultores',
                    d: 'Que cresceram seus negócios com minha orientação.',
                  },
                  {
                    icon: Video,
                    n: 'Depoimentos reais',
                    t: 'em vídeo no YouTube',
                    d: 'Anderson Maisse, Andreza Emerick, Anderson Souza, Bruno Nascimento, Marta Giove e Matheus Simões.',
                  },
                  {
                    icon: GraduationCap,
                    n: 'Metodologia testada',
                    t: 'desenvolvida em 10+ anos',
                    d: 'Refinada com centenas de casos. Documentada e estruturada.',
                  },
                  {
                    icon: Lightbulb,
                    n: 'Conhecimento vertical',
                    t: 'dos principais nichos digitais',
                    d: 'Infoprodutos, agências de lançamento, marketing digital, consultoria B2B.',
                  },
                ].map((s) => (
                  <Card key={s.n}>
                    <CardContent className="p-6">
                      <s.icon className="mb-3 h-6 w-6 text-primary" />
                      <div className="text-lg font-bold leading-tight">{s.n}</div>
                      <div className="mt-1 text-sm font-medium text-muted-foreground">{s.t}</div>
                      <div className="mt-3 text-xs text-muted-foreground">{s.d}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mx-auto mt-12 max-w-3xl rounded-lg border bg-card p-6 text-center md:p-8">
                <p className="text-2xl font-bold">Não é sorte. É SISTEMA.</p>
                <p className="mt-3 text-muted-foreground">
                  E esse sistema funciona porque é baseado em <strong className="text-foreground">dados reais</strong>,{' '}
                  <strong className="text-foreground">experiência prática</strong>,{' '}
                  <strong className="text-foreground">resultados comprovados</strong> e{' '}
                  <strong className="text-foreground">metodologia estruturada</strong>.
                </p>
                <p className="mt-3 text-muted-foreground">
                  Quando você contrata um diagnóstico comigo, não está pagando por opinião. Está pagando por
                  conhecimento que levou 10+ anos para construir e que já gerou R$ 40 milhões em resultados para outros clientes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* QUEM SOU EU */}
        <section id="quem-sou-eu" className="border-b bg-muted/30 py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[auto_1fr] md:gap-14">
              <div className="mx-auto md:mx-0">
                <div className="relative">
                  <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 blur-xl" />
                  <img
                    src={andersonPortrait}
                    alt="Anderson Gomes — Estrategista Digital"
                    width={280}
                    height={280}
                    loading="lazy"
                    className="relative h-64 w-64 rounded-2xl object-cover shadow-xl ring-1 ring-border md:h-72 md:w-72"
                  />
                </div>
              </div>
              <div>
                <Badge variant="secondary" className="mb-3">Quem sou eu</Badge>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Anderson Gomes</h2>
                <p className="mt-1 text-lg font-medium text-muted-foreground">
                  Mentor & Estrategista Digital
                </p>
                <div className="mt-5 space-y-4 text-muted-foreground">
                  <p>
                    Estrategista digital com <strong className="text-foreground">mais de 10 anos</strong> de
                    experiência em marketing digital, funis de vendas e estruturação de negócios online.
                    Especialista em ajudar infoprodutores a transformar conhecimento em receita previsível.
                  </p>
                  <p>
                    Referência em como aplicar <strong className="text-foreground">Inteligência Artificial</strong>{' '}
                    em negócios digitais, ajudando empreendedores a escalar seus resultados com tecnologia e
                    estratégia. Já gerenciei <strong className="text-foreground">+R$ 40 milhões</strong> em
                    resultados digitais e mentorei mais de <strong className="text-foreground">500 alunos</strong>
                    {' '}que somam <strong className="text-foreground">+R$ 50 milhões</strong> faturados.
                  </p>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  {[
                    { n: '10+', t: 'anos de experiência' },
                    { n: '500+', t: 'alunos mentorados' },
                    { n: 'R$ 50M+', t: 'faturados por alunos' },
                  ].map((s) => (
                    <div key={s.t} className="rounded-lg border bg-card p-3">
                      <div className="text-xl font-bold">{s.n}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{s.t}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1.5">
                    <BookOpen className="h-3 w-3" /> Autor de "DNA Digital de Sucesso"
                  </Badge>
                  <Badge variant="outline" className="gap-1.5">
                    <Briefcase className="h-3 w-3" /> SENAI · Coca-Cola · Jovem Pan
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DEPOIMENTOS */}
        <section className="border-b py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-3">
                <Video className="mr-1 h-3 w-3" /> Depoimentos em vídeo
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">O que dizem meus clientes</h2>
              <p className="mt-3 text-muted-foreground">
                Resultados reais, na voz de quem viveu. Clique no play para assistir.
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <Card key={t.videoId} className="overflow-hidden">
                  <YouTubeLite videoId={t.videoId} title={`${t.name} — Depoimento`} />
                  <CardContent className="p-5">
                    <div className="mb-2 flex gap-0.5 text-primary">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">"{t.quote}"</p>
                    <div className="mt-4 border-t pt-3">
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>


        {/* FAQ */}
        <section className="border-b py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Perguntas frequentes</h2>
                <p className="mt-3 text-muted-foreground">Tire suas dúvidas antes de contratar.</p>
              </div>
              <Accordion type="single" collapsible className="mt-10 w-full">
                {[
                  {
                    q: 'Quanto tempo leva para eu ver resultado?',
                    a: 'Depende do que você implementar. Alguns clientes veem resultado em dias (quando identificam um gargalo óbvio). Outros em semanas (quando precisam testar uma nova estratégia). Mas a maioria vê resultado significativo em 30–90 dias. O importante é que você terá um plano claro desde o dia 1 — não será mais "tentativa e erro", será execução estratégica.',
                  },
                  {
                    q: 'O diagnóstico é genérico ou personalizado?',
                    a: '100% personalizado. Você preenche um formulário detalhado sobre seu negócio. A IA analisa seus dados específicos. As recomendações são para VOCÊ, não para "todo mundo". É como a diferença entre um personal trainer genérico e um que conhece sua história, seu corpo e seus objetivos. Muito mais efetivo.',
                  },
                  {
                    q: 'E se eu não gostar do diagnóstico?',
                    a: 'Você tem 7 dias de garantia incondicional. Se não gostar, devolvemos 100% do seu dinheiro. Sem perguntas. Sem complicações. Mas aviso: 99% dos clientes amam o resultado, porque é real, prático e acionável.',
                  },
                  {
                    q: 'Qual a diferença entre o diagnóstico rápido e o completo?',
                    a: 'O rápido é perfeito se você quer CLAREZA — você recebe um relatório profissional com tudo que precisa saber. O completo é para quem quer GARANTIA DE IMPLEMENTAÇÃO — você recebe o relatório MAIS uma reunião 1:1 comigo para esclarecer dúvidas, priorizar ações, identificar quick wins e ter um plano executável. Se tem dúvidas sobre como implementar, escolha o completo. Se quer só a análise, escolha o rápido.',
                  },
                  {
                    q: 'Funciona para qualquer nicho?',
                    a: 'Sim. Funciona para infoprodutores, agências de lançamento, consultores de marketing digital, coaches, agências de marketing e qualquer negócio digital. A IA se adapta ao seu nicho específico.',
                  },
                  {
                    q: 'Como funciona a reunião do diagnóstico completo?',
                    a: 'Simples: 1) Você contrata o diagnóstico completo; 2) Preenche o formulário detalhado; 3) Eu analiso seus dados (48h); 4) Você recebe o relatório em PDF; 5) Marcamos uma reunião de 60 minutos; 6) Na reunião, eu explico tudo, respondo dúvidas e criamos um plano. Você sai com clareza e direção.',
                  },
                ].map((item, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* URGÊNCIA */}
        <section className="border-b bg-gradient-to-br from-accent/40 via-background to-background py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <div className="text-center">
                <Badge variant="secondary" className="mb-4">
                  <Clock className="mr-1 h-3 w-3" /> Atenção
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  A pergunta não é "posso pagar R$ 197?"
                </h2>
                <p className="mt-4 text-xl font-medium text-muted-foreground">
                  É <span className="text-foreground">"quanto estou perdendo por NÃO saber o que fazer?"</span>
                </p>
              </div>

              <div className="mt-10 space-y-4 text-lg text-muted-foreground">
                <p>
                  Cada dia que passa sem saber qual é o seu gargalo... cada dia que você continua com a estratégia
                  errada... cada dia que você não tem um plano... é dinheiro que você está perdendo.
                </p>
              </div>

              <Card className="mt-8 border-primary/40">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-3">
                    <DollarSign className="mt-1 h-6 w-6 shrink-0 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">Faça a conta:</p>
                      <p className="mt-2 text-muted-foreground">
                        Se você fatura <strong className="text-foreground">R$ 10 mil/mês</strong> e está deixando{' '}
                        <strong className="text-foreground">20% na mesa</strong>, são{' '}
                        <strong className="text-foreground">R$ 2 mil/mês</strong> perdidos.{' '}
                        <strong className="text-foreground">R$ 24 mil por ano.</strong>
                      </p>
                      <p className="mt-3 text-muted-foreground">
                        Um diagnóstico de R$ 197 que recupera apenas 10% disso{' '}
                        <strong className="text-foreground">se paga em dias</strong>.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <p className="mt-8 text-center text-lg font-semibold text-foreground">
                Não pense em quanto você vai gastar. Pense em quanto você vai ganhar.
              </p>

              <div className="mt-8 flex justify-center">
                <Button asChild size="lg">
                  <a href="#produtos">
                    Quero contratar agora <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* GARANTIA + CTA FINAL */}
        <section className="border-b bg-gradient-to-br from-primary/5 via-background to-background py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Garantia incondicional de 7 dias
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Se você não achar o diagnóstico útil, devolvemos 100% do seu investimento. Sem perguntas, sem
                complicações, sem burocracia.
              </p>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                Mas sendo honesto: 99% dos clientes amam o resultado. Porque é{' '}
                <strong className="text-foreground">real</strong>, é{' '}
                <strong className="text-foreground">prático</strong> e é{' '}
                <strong className="text-foreground">acionável</strong>. O único "risco" é você não agir com base
                nas recomendações.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link to={ctaHref}>
                    Contratar Diagnóstico Completo (R$ 297) <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link to={ctaHref}>Contratar Diagnóstico Rápido (R$ 197)</Link>
                </Button>
              </div>
              <p className="mt-6 text-xs text-muted-foreground">
                Pagamento seguro via Hotmart/Kiwify · Liberação automática após o pagamento
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Anderson Gomes — Diagnóstico de Negócios Digitais</span>
          <div className="flex gap-4">
            <Link to="/como-funciona" className="hover:text-foreground">Como funciona</Link>
            <Link to="/login" className="hover:text-foreground">Entrar</Link>
            <Link to="/signup" className="hover:text-foreground">Criar conta</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
