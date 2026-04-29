import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Loader2, TrendingUp, TrendingDown, DollarSign, Bot } from 'lucide-react';

interface VendaRow {
  id: string;
  created_at: string;
  origem: string;
  email_comprador: string | null;
  transacao_externa_id: string | null;
  valor_bruto_centavos: number | null;
  taxa_gateway_centavos: number | null;
  comissao_produtor_centavos: number | null;
  comissao_coprodutor_centavos: number | null;
  comissao_afiliado_centavos: number | null;
  valor_liquido_centavos: number | null;
  moeda: string | null;
  estornado_em: string | null;
}

interface CustoRow {
  id: string;
  created_at: string;
  tipo: string;
  modelo: string | null;
  provider: string | null;
  tokens_input: number | null;
  tokens_output: number | null;
  custo_usd: number | null;
  sucesso: boolean;
}

const fmtBRL = (cents: number | null) =>
  cents == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const fmtUSD = (v: number | null) =>
  v == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

const downloadCsv = (filename: string, rows: Record<string, unknown>[]) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const FinanceiroAdmin = () => {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [usdBrl, setUsdBrl] = useState(5.5);

  const fromIso = `${from}T00:00:00Z`;
  const toIso = `${to}T23:59:59Z`;

  const { data: vendas, isLoading: loadingVendas } = useQuery({
    queryKey: ['fin-vendas', from, to],
    queryFn: async (): Promise<VendaRow[]> => {
      const { data, error } = await supabase
        .from('creditos_diagnostico')
        .select(
          'id, created_at, origem, email_comprador, transacao_externa_id, valor_bruto_centavos, taxa_gateway_centavos, comissao_produtor_centavos, comissao_coprodutor_centavos, comissao_afiliado_centavos, valor_liquido_centavos, moeda, estornado_em',
        )
        .gte('created_at', fromIso)
        .lte('created_at', toIso)
        .in('origem', ['hotmart', 'kiwify', 'outro'])
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as VendaRow[];
    },
  });

  const { data: custos, isLoading: loadingCustos } = useQuery({
    queryKey: ['fin-custos', from, to],
    queryFn: async (): Promise<CustoRow[]> => {
      const { data, error } = await supabase
        .from('operacoes_ia')
        .select('id, created_at, tipo, modelo, provider, tokens_input, tokens_output, custo_usd, sucesso')
        .gte('created_at', fromIso)
        .lte('created_at', toIso)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as CustoRow[];
    },
  });

  const kpis = useMemo(() => {
    const v = vendas ?? [];
    const ativas = v.filter((r) => !r.estornado_em);
    const sum = (key: keyof VendaRow) =>
      ativas.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
    const bruto = sum('valor_bruto_centavos');
    const taxa = sum('taxa_gateway_centavos');
    const comProdutor = sum('comissao_produtor_centavos');
    const comCoprodutor = sum('comissao_coprodutor_centavos');
    const comAfiliado = sum('comissao_afiliado_centavos');
    const liquido = sum('valor_liquido_centavos');
    const estornado = v
      .filter((r) => r.estornado_em)
      .reduce((acc, r) => acc + (Number(r.valor_bruto_centavos) || 0), 0);
    const numVendas = ativas.length;
    const numEstornos = v.length - ativas.length;

    const custoUsd = (custos ?? []).reduce((acc, r) => acc + (Number(r.custo_usd) || 0), 0);
    const custoBrl = Math.round(custoUsd * usdBrl * 100);
    const margem = liquido - custoBrl;
    const margemPct = liquido > 0 ? (margem / liquido) * 100 : 0;
    const ticketMedio = numVendas > 0 ? bruto / numVendas : 0;

    // Custo por modelo
    const porModelo: Record<string, { usd: number; ops: number }> = {};
    (custos ?? []).forEach((c) => {
      const k = c.modelo ?? 'desconhecido';
      porModelo[k] = porModelo[k] ?? { usd: 0, ops: 0 };
      porModelo[k].usd += Number(c.custo_usd) || 0;
      porModelo[k].ops += 1;
    });

    return {
      bruto, taxa, comProdutor, comCoprodutor, comAfiliado, liquido,
      estornado, numVendas, numEstornos, custoUsd, custoBrl, margem, margemPct, ticketMedio, porModelo,
    };
  }, [vendas, custos, usdBrl]);

  const exportVendas = () => {
    const rows = (vendas ?? []).map((r) => ({
      data: new Date(r.created_at).toLocaleString('pt-BR'),
      gateway: r.origem,
      transacao: r.transacao_externa_id ?? '',
      email: r.email_comprador ?? '',
      moeda: r.moeda ?? 'BRL',
      bruto: r.valor_bruto_centavos != null ? (r.valor_bruto_centavos / 100).toFixed(2) : '',
      taxa_gateway: r.taxa_gateway_centavos != null ? (r.taxa_gateway_centavos / 100).toFixed(2) : '',
      comissao_produtor: r.comissao_produtor_centavos != null ? (r.comissao_produtor_centavos / 100).toFixed(2) : '',
      comissao_coprodutor: r.comissao_coprodutor_centavos != null ? (r.comissao_coprodutor_centavos / 100).toFixed(2) : '',
      comissao_afiliado: r.comissao_afiliado_centavos != null ? (r.comissao_afiliado_centavos / 100).toFixed(2) : '',
      liquido: r.valor_liquido_centavos != null ? (r.valor_liquido_centavos / 100).toFixed(2) : '',
      estornado_em: r.estornado_em ?? '',
    }));
    downloadCsv(`vendas_${from}_${to}.csv`, rows);
  };

  const exportCustos = () => {
    const rows = (custos ?? []).map((r) => ({
      data: new Date(r.created_at).toLocaleString('pt-BR'),
      tipo: r.tipo,
      modelo: r.modelo ?? '',
      provider: r.provider ?? '',
      tokens_input: r.tokens_input ?? 0,
      tokens_output: r.tokens_output ?? 0,
      custo_usd: (r.custo_usd ?? 0).toFixed(6),
      sucesso: r.sucesso ? 'sim' : 'não',
    }));
    downloadCsv(`custos_ia_${from}_${to}.csv`, rows);
  };

  const loading = loadingVendas || loadingCustos;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-sm text-muted-foreground">
          Receita das vendas (bruto, taxas, comissões e líquido) versus custos de IA.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div>
            <Label className="text-xs">De</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[160px]" />
          </div>
          <div>
            <Label className="text-xs">Até</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[160px]" />
          </div>
          <div>
            <Label className="text-xs">USD → BRL</Label>
            <Input
              type="number" step="0.01" min={0}
              value={usdBrl}
              onChange={(e) => setUsdBrl(Math.max(0, Number(e.target.value)))}
              className="w-[100px]"
            />
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={exportVendas} disabled={!vendas?.length}>
              <Download className="mr-2 h-4 w-4" /> Vendas CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportCustos} disabled={!custos?.length}>
              <Download className="mr-2 h-4 w-4" /> Custos CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Receita bruta
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">{fmtBRL(kpis.bruto)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {kpis.numVendas} venda{kpis.numVendas === 1 ? '' : 's'}
            {kpis.numEstornos > 0 && (
              <span className="ml-1 text-destructive">· {kpis.numEstornos} estorno{kpis.numEstornos === 1 ? '' : 's'}</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Receita líquida
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">{fmtBRL(kpis.liquido)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Após taxas e comissões
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Bot className="h-4 w-4" /> Custo IA
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">{fmtBRL(kpis.custoBrl)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {fmtUSD(kpis.custoUsd)} · cotação {usdBrl}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              {kpis.margem >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
              Margem
            </CardDescription>
            <CardTitle className={`text-2xl tabular-nums ${kpis.margem < 0 ? 'text-destructive' : ''}`}>
              {fmtBRL(kpis.margem)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {kpis.margemPct.toFixed(1)}% da receita líquida
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card><CardHeader className="pb-1"><CardDescription>Taxas gateway</CardDescription>
          <CardTitle className="text-base tabular-nums">{fmtBRL(kpis.taxa)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-1"><CardDescription>Coprodutor</CardDescription>
          <CardTitle className="text-base tabular-nums">{fmtBRL(kpis.comCoprodutor)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-1"><CardDescription>Afiliado</CardDescription>
          <CardTitle className="text-base tabular-nums">{fmtBRL(kpis.comAfiliado)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-1"><CardDescription>Ticket médio</CardDescription>
          <CardTitle className="text-base tabular-nums">{fmtBRL(Math.round(kpis.ticketMedio))}</CardTitle></CardHeader></Card>
      </div>

      <Tabs defaultValue="vendas">
        <TabsList>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="custos">Custos IA</TabsTrigger>
          <TabsTrigger value="modelos">Por modelo</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : !vendas?.length ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Sem vendas no período.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Gateway</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                      <TableHead className="text-right">Coprod.</TableHead>
                      <TableHead className="text-right">Afiliado</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendas.map((r) => (
                      <TableRow key={r.id} className={r.estornado_em ? 'opacity-50' : ''}>
                        <TableCell className="text-xs">{new Date(r.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{r.origem}</Badge></TableCell>
                        <TableCell className="text-xs truncate max-w-[200px]">{r.email_comprador ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtBRL(r.valor_bruto_centavos)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{fmtBRL(r.taxa_gateway_centavos)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{fmtBRL(r.comissao_coprodutor_centavos)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{fmtBRL(r.comissao_afiliado_centavos)}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{fmtBRL(r.valor_liquido_centavos)}</TableCell>
                        <TableCell>
                          {r.estornado_em
                            ? <Badge variant="destructive">Estornada</Badge>
                            : <Badge variant="default">OK</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custos">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : !custos?.length ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Sem operações de IA no período.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead className="text-right">Tokens in</TableHead>
                      <TableHead className="text-right">Tokens out</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {custos.slice(0, 200).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs">{new Date(r.created_at).toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="text-xs">{r.tipo}</TableCell>
                        <TableCell className="text-xs font-mono">{r.modelo ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.tokens_input ?? 0}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.tokens_output ?? 0}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtUSD(r.custo_usd)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modelos">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead className="text-right">Operações</TableHead>
                    <TableHead className="text-right">Custo USD</TableHead>
                    <TableHead className="text-right">Custo BRL (est.)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(kpis.porModelo)
                    .sort((a, b) => b[1].usd - a[1].usd)
                    .map(([modelo, v]) => (
                      <TableRow key={modelo}>
                        <TableCell className="font-mono text-xs">{modelo}</TableCell>
                        <TableCell className="text-right tabular-nums">{v.ops}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtUSD(v.usd)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtBRL(Math.round(v.usd * usdBrl * 100))}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceiroAdmin;