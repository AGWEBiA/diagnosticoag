import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCreditos } from '@/hooks/useCreditos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatarMenu } from '@/components/UserAvatarMenu';
import { ArrowLeft, ExternalLink, Loader2, Sparkles } from 'lucide-react';

interface ProdutoView {
  id: string;
  nome: string;
  descricao: string | null;
  preco_centavos: number | null;
  moeda: string | null;
  checkout_url: string | null;
  creditos_concedidos: number;
  gateway: string;
}

interface PagamentoConfig {
  titulo: string;
  descricao: string;
}

const formatPreco = (cents: number | null, moeda: string | null) => {
  if (!cents) return null;
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moeda ?? 'BRL' }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${moeda ?? 'BRL'}`;
  }
};

const Comprar = () => {
  const { user } = useAuth();
  const { creditos, loading: loadingCreditos } = useCreditos();
  const [produtos, setProdutos] = useState<ProdutoView[]>([]);
  const [config, setConfig] = useState<PagamentoConfig>({
    titulo: 'Solicite seu diagnóstico',
    descricao: 'Cada diagnóstico inclui análise estratégica completa do seu negócio digital com IA vertical.',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: prods }, { data: cfg }] = await Promise.all([
        supabase
          .from('produtos_pagamento')
          .select('id, nome, descricao, preco_centavos, moeda, checkout_url, creditos_concedidos, gateway')
          .eq('ativo', true)
          .order('preco_centavos', { ascending: true }),
        supabase.from('app_settings').select('value').eq('key', 'pagamento').maybeSingle(),
      ]);
      setProdutos((prods ?? []) as ProdutoView[]);
      if (cfg?.value) {
        const v = cfg.value as Partial<PagamentoConfig>;
        setConfig((c) => ({ ...c, ...v }));
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Solicitar diagnóstico | Anderson Gomes</title>
        <meta name="description" content="Escolha um plano e libere seu diagnóstico estratégico de negócio digital." />
      </Helmet>

      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-semibold">
            Anderson Gomes
          </Link>
          <UserAvatarMenu />
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-10">
        <Link to="/" className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
        </Link>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">{config.titulo}</h1>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">{config.descricao}</p>
          {!loadingCreditos && user && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Você tem <strong>{creditos}</strong> diagnóstico(s) disponível(is)
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : produtos.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Nenhum produto disponível no momento. Entre em contato para mais informações.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {produtos.map((p) => {
              const preco = formatPreco(p.preco_centavos, p.moeda);
              return (
                <Card key={p.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{p.nome}</CardTitle>
                      {p.creditos_concedidos > 1 && (
                        <Badge variant="secondary">{p.creditos_concedidos} diagnósticos</Badge>
                      )}
                    </div>
                    {p.descricao && <CardDescription>{p.descricao}</CardDescription>}
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-4">
                    {preco && <div className="text-3xl font-bold">{preco}</div>}
                    <Button
                      asChild
                      disabled={!p.checkout_url}
                      className="w-full"
                    >
                      <a href={p.checkout_url ?? '#'} target="_blank" rel="noopener noreferrer">
                        Comprar agora
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                    {user?.email && (
                      <p className="text-center text-xs text-muted-foreground">
                        Use o e-mail <strong>{user.email}</strong> no checkout para liberar automaticamente.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Comprar;
