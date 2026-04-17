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
  Calendar,
  Sparkles,
} from 'lucide-react';

const Landing = () => {
  const { user } = useAuth();
  const ctaHref = user ? '/comprar' : '/signup';

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Diagnóstico de Negócios Digitais | Anderson Gomes</title>
        <meta
          name="description"
          content="Descubra os gargalos reais do seu negócio digital com análise estratégica feita por IA Enterprise-Grade + 10+ anos de experiência. Plano de ação claro para crescer."
        />
        <link rel="canonical" href={`${window.location.origin}/`} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Diagnóstico de Negócios Digitais',
            description:
              'Análise estratégica do seu negócio digital com IA vertical: identificação de gargalos, plano de ação priorizado e relatório executivo em PDF.',
            provider: {
              '@type': 'Person',
              name: 'Anderson Gomes',
            },
            areaServed: 'BR',
            offers: [
              {
                '@type': 'Offer',
                name: 'Diagnóstico Rápido',
                price: '197',
                priceCurrency: 'BRL',
              },
              {
                '@type': 'Offer',
                name: 'Diagnóstico Completo',
                price: '297',
                priceCurrency: 'BRL',
              },
            ],
          })}
        </script>
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="font-semibold">
            Anderson Gomes
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
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">
                    <LogIn className="mr-2 h-4 w-4" /> Entrar
                  </Link>
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
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-background" />
          <div className="container mx-auto px-4 py-20 md:py-28">
            <div className="mx-auto max-w-4xl text-center">
              <Badge variant="secondary" className="mb-6">
                <Sparkles className="mr-1 h-3 w-3" /> Análise estratégica com IA Enterprise-Grade
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                Descubra os gargalos reais do seu negócio digital
              </h1>
              <p className="mt-4 text-xl font-medium text-muted-foreground md:text-2xl">
                E saiba <span className="text-foreground">exatamente</span> o que fazer para crescer
              </p>
              <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
                Análise profunda + estratégia personalizada baseada em <strong className="text-foreground">10+ anos</strong>{' '}
                de experiência gerenciando <strong className="text-foreground">+R$ 40 milhões</strong> em resultados digitais
                para empresas como SENAI, Coca-Cola e Grupo Jovem Pan.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <a href="#produtos">
                    Ver opções de diagnóstico
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link to="/como-funciona">Como funciona</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Garantia de 7 dias
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" /> Entrega em até 5 dias
                </span>
                <span className="inline-flex items-center gap-1.5">
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
                Você está deixando dinheiro na mesa
              </h2>
              <div className="mt-6 space-y-4 text-lg text-muted-foreground">
                <p>
                  Pode parecer duro, mas é a verdade que a maioria dos empreendedores digitais não quer ouvir.
                </p>
                <p>
                  Você tem um negócio, tem tráfego, tem clientes… mas algo não está clicando. Seu faturamento
                  não cresce como deveria. Sua margem é menor que a dos concorrentes. E você não sabe
                  exatamente onde está o problema.
                </p>
                <p className="text-foreground">
                  <strong>
                    A maioria dos negócios digitais falha não porque a estratégia é ruim, mas porque ninguém
                    fez um diagnóstico profundo antes de agir.
                  </strong>
                </p>
                <p>
                  É como tentar consertar um carro sem saber o que está quebrado. Mas se você souber
                  exatamente qual é o problema, com um plano claro de ação, tudo muda.
                </p>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Target, t: 'Identificação dos gargalos reais', d: 'Avaliação dos 5 pilares do seu negócio.' },
                  { icon: TrendingUp, t: 'Oportunidades de crescimento', d: 'Onde está o ROI e o que está desperdiçando dinheiro.' },
                  { icon: FileText, t: 'Relatório executivo em PDF', d: '15+ páginas, score de saúde e recomendações.' },
                  { icon: Calendar, t: 'Plano de ação 30/90/365', d: 'O que fazer hoje, em 90 dias e em 1 ano.' },
                ].map((b) => (
                  <Card key={b.t}>
                    <CardContent className="flex gap-3 p-5">
                      <b.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <h3 className="font-semibold">{b.t}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{b.d}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PRODUTOS */}
        <section id="produtos" className="border-b bg-muted/30 py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Qual é o seu próximo passo?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Escolha a opção que melhor se encaixa no seu momento.
              </p>
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
                    <div className="text-4xl font-bold">R$ 197</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <Clock className="mr-1 inline h-3 w-3" /> Entrega em até 48 horas
                    </div>
                  </div>
                  <ul className="space-y-3 text-sm">
                    {[
                      'Análise profunda com IA Enterprise-Grade',
                      'Avaliação dos 5 pilares do negócio',
                      'Relatório em PDF de 15+ páginas',
                      'Score de saúde do negócio (0–100)',
                      'Classificação em quadrantes',
                      'Plano de ação para 30, 90 e 365 dias',
                      'Análise de estratégias e ROI',
                      'Identificação de oportunidades',
                    ].map((item) => (
                      <li key={item} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 space-y-3">
                    <Button asChild size="lg" variant="outline" className="w-full">
                      <Link to={ctaHref}>Contratar diagnóstico rápido</Link>
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Ideal para quem quer clareza rápida e prefere autonomia.
                    </p>
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
                    <h3 className="text-xl font-bold">Diagnóstico Completo</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Análise + relatório + reunião 1:1 com Anderson Gomes
                  </p>
                  <div className="my-6">
                    <div className="text-4xl font-bold">R$ 297</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <Clock className="mr-1 inline h-3 w-3" /> Entrega em até 5 dias úteis
                    </div>
                  </div>
                  <p className="mb-3 text-sm font-medium">Tudo do plano rápido, mais:</p>
                  <ul className="space-y-3 text-sm">
                    {[
                      'Reunião 1:1 de 60 minutos com Anderson Gomes',
                      'Direcionamento estratégico personalizado',
                      'Identificação de quick wins',
                      'Resposta a perguntas específicas',
                      'Acesso a recursos e templates exclusivos',
                      'Suporte por 30 dias por email',
                    ].map((item) => (
                      <li key={item} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 space-y-3">
                    <Button asChild size="lg" className="w-full">
                      <Link to={ctaHref}>Contratar diagnóstico completo</Link>
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Ideal para quem quer máxima clareza e implementação garantida.
                    </p>
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
                      <th className="p-4 text-center font-semibold">Rápido<div className="text-xs text-muted-foreground">R$ 197</div></th>
                      <th className="p-4 text-center font-semibold">Completo<div className="text-xs text-muted-foreground">R$ 297</div></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { f: 'Análise com IA Enterprise-Grade', r: true, c: true },
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
            <div className="mx-auto max-w-4xl">
              <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Por que confiar no meu trabalho?
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                  Não sou um "guru" que vende ilusões. Sou um profissional com mais de 10 anos de experiência
                  real no mercado digital.
                </p>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { n: '+R$ 40M', t: 'em resultados gerenciados', icon: TrendingUp },
                  { n: '10+ anos', t: 'de experiência no mercado', icon: Award },
                  { n: 'Centenas', t: 'de experts atendidos', icon: Users },
                  { n: '6 nichos', t: 'mapeados em profundidade', icon: Target },
                ].map((s) => (
                  <Card key={s.t}>
                    <CardContent className="p-6 text-center">
                      <s.icon className="mx-auto mb-3 h-6 w-6 text-primary" />
                      <div className="text-2xl font-bold">{s.n}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{s.t}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-10 rounded-lg border bg-card p-6 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  Empresas que já confiaram no meu trabalho
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-lg font-semibold text-muted-foreground">
                  <span>SENAI</span>
                  <span className="text-muted-foreground/30">•</span>
                  <span>Coca-Cola</span>
                  <span className="text-muted-foreground/30">•</span>
                  <span>Grupo Jovem Pan</span>
                  <span className="text-muted-foreground/30">•</span>
                  <span>+ Centenas de experts e infoprodutores</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DEPOIMENTOS */}
        <section className="border-b bg-muted/30 py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                O que dizem meus clientes
              </h2>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
              {[
                {
                  q: 'Depois do diagnóstico, identifiquei que estava gastando 60% do meu orçamento em um canal que rendia apenas 10% de resultado. Redirecionei e meu faturamento cresceu 3x em 3 meses.',
                  a: 'Anderson Maisse',
                  r: 'Infoprodutor',
                },
                {
                  q: 'O relatório foi tão preciso que parecia que Anderson tinha passado um mês dentro da minha empresa. Cada recomendação foi exatamente o que eu precisava ouvir.',
                  a: 'Andreza Emerick',
                  r: 'Consultora de Marketing',
                },
                {
                  q: 'Contratar o diagnóstico completo foi a melhor decisão. A reunião com Anderson me deu clareza sobre o que fazer nos próximos 12 meses. Já implementei 3 recomendações e estou vendo resultado.',
                  a: 'Anderson Souza',
                  r: 'Dono de Agência',
                },
                {
                  q: 'Recomendo para todo empreendedor digital que quer crescer. Não é um gasto, é um investimento que retorna em dias.',
                  a: 'Bruno Nascimento',
                  r: 'Infoprodutor',
                },
              ].map((d) => (
                <Card key={d.a}>
                  <CardContent className="p-6">
                    <div className="mb-3 flex gap-0.5 text-primary">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">"{d.q}"</p>
                    <div className="mt-4 border-t pt-3">
                      <div className="font-semibold">{d.a}</div>
                      <div className="text-xs text-muted-foreground">{d.r}</div>
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
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Perguntas frequentes
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Tire suas dúvidas antes de contratar.
                </p>
              </div>
              <Accordion type="single" collapsible className="mt-10 w-full">
                {[
                  {
                    q: 'Quanto tempo leva para eu ver resultado?',
                    a: 'Depende do que você implementar. Alguns clientes veem resultado em dias (quando identificam um gargalo óbvio). Outros em semanas. Mas a maioria vê resultado significativo em 30–90 dias. O importante é que você terá um plano claro desde o dia 1, então não será mais "tentativa e erro".',
                  },
                  {
                    q: 'O diagnóstico é genérico ou personalizado?',
                    a: '100% personalizado. Você preenche um formulário detalhado sobre seu negócio, a IA analisa seus dados específicos e as recomendações são para você, não para "todo mundo".',
                  },
                  {
                    q: 'E se eu não gostar do diagnóstico?',
                    a: 'Você tem 7 dias de garantia incondicional. Se não gostar, devolvemos 100% do seu investimento. Sem perguntas, sem complicações.',
                  },
                  {
                    q: 'Qual a diferença entre o diagnóstico rápido e o completo?',
                    a: 'O rápido entrega o relatório em PDF com tudo que você precisa saber. O completo adiciona uma reunião 1:1 de 60 minutos comigo para esclarecer dúvidas, priorizar ações, identificar quick wins e ter um plano executável.',
                  },
                  {
                    q: 'Funciona para qualquer nicho?',
                    a: 'Sim. Atende infoprodutores, agências de lançamento, consultores de marketing, coaches, agências e qualquer negócio digital. A IA se adapta ao seu nicho específico.',
                  },
                  {
                    q: 'Como funciona a reunião do plano completo?',
                    a: '1) Você contrata; 2) Preenche o formulário detalhado; 3) Eu analiso seus dados; 4) Você recebe o relatório em PDF; 5) Marcamos uma reunião de 60 minutos; 6) Na reunião, eu explico tudo, respondo dúvidas e construímos um plano de ação.',
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
                Se você não achar o diagnóstico útil, devolvemos 100% do seu investimento. Sem perguntas,
                sem complicações, sem burocracia. O único risco é você não agir com base nas recomendações.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link to={ctaHref}>
                    Contratar agora com garantia
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link to="/como-funciona">Ver como funciona</Link>
                </Button>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                A pergunta não é "posso pagar R$ 197?". É <strong className="text-foreground">"quanto estou perdendo por não saber o que fazer?"</strong>
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Anderson Gomes — Diagnóstico de Negócios Digitais</span>
          <div className="flex gap-4">
            <Link to="/como-funciona" className="hover:text-foreground">
              Como funciona
            </Link>
            <Link to="/login" className="hover:text-foreground">
              Entrar
            </Link>
            <Link to="/signup" className="hover:text-foreground">
              Criar conta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
