import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatarMenu } from '@/components/UserAvatarMenu';
import {
  ArrowRight,
  BrainCircuit,
  ShieldCheck,
  Target,
  LogIn,
} from 'lucide-react';

const beneficios = [
  {
    icon: BrainCircuit,
    titulo: 'Análise com IA vertical',
    descricao:
      'Diagnóstico estratégico do seu negócio digital baseado em conhecimento verificado, sem alucinações.',
  },
  {
    icon: Target,
    titulo: 'Recomendações acionáveis',
    descricao:
      'Receba prioridades claras para os próximos 90 dias, focadas no seu maior gargalo declarado.',
  },
  {
    icon: ShieldCheck,
    titulo: 'Confiabilidade auditável',
    descricao:
      'Cada análise é registrada com pontuação de confiança, fontes de RAG e trilha de auditoria completa.',
  },
];

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Diagnóstico de Negócios Digitais com IA | Análise estratégica</title>
        <meta
          name="description"
          content="Diagnóstico estratégico do seu negócio digital com IA vertical: análise auditável, recomendações priorizadas e relatório completo entregue em reunião."
        />
        <link rel="canonical" href={`${window.location.origin}/`} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Diagnóstico de Negócios Digitais com IA',
            description:
              'Diagnóstico estratégico do seu negócio digital com IA vertical: análise auditável, recomendações priorizadas e relatório completo entregue em reunião.',
            provider: { '@type': 'Organization', name: 'Anderson Gomes' },
            areaServed: 'BR',
          })}
        </script>
      </Helmet>

      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="font-semibold">
            Diagnóstico IA
          </Link>
          <nav className="flex items-center gap-2">
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
        {/* Hero */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Diagnóstico estratégico do seu negócio digital com IA
            </h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              Responda algumas perguntas e receba uma análise auditável com recomendações
              priorizadas. O relatório completo é apresentado e entregue por mim em uma
              reunião de diagnóstico.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to={user ? '/diagnostico' : '/signup'}>
                  Fazer diagnóstico gratuito
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {!user && (
                <Button asChild size="lg" variant="outline">
                  <Link to="/login">Já tenho conta</Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section className="container mx-auto px-4 pb-16 md:pb-24">
          <div className="grid gap-4 md:grid-cols-3">
            {beneficios.map((b) => (
              <Card key={b.titulo}>
                <CardContent className="p-6">
                  <b.icon className="mb-3 h-8 w-8 text-primary" />
                  <h2 className="text-lg font-semibold">{b.titulo}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{b.descricao}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Como funciona */}
        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold md:text-3xl">Como funciona</h2>
              <p className="mt-2 text-muted-foreground">
                Em três passos simples até a sua reunião de diagnóstico.
              </p>
            </div>
            <ol className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-3">
              {[
                {
                  n: '1',
                  t: 'Responda o formulário',
                  d: 'Cinco etapas curtas sobre seu negócio, metas e estratégias atuais.',
                },
                {
                  n: '2',
                  t: 'IA analisa em segundos',
                  d: 'Geramos resumo executivo, score de maturidade e recomendações priorizadas.',
                },
                {
                  n: '3',
                  t: 'Reunião de entrega',
                  d: 'Apresento o relatório completo em PDF e discutimos o plano de ação.',
                },
              ].map((s) => (
                <li key={s.n}>
                  <Card>
                    <CardContent className="p-6">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                        {s.n}
                      </div>
                      <h3 className="font-semibold">{s.t}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
            <div className="mt-10 text-center">
              <Button asChild size="lg">
                <Link to={user ? '/diagnostico' : '/signup'}>
                  Começar agora <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Diagnóstico IA</span>
          <div className="flex gap-4">
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
