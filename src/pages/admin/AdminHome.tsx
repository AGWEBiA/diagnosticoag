import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  FileText,
  Users,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type DiagStatus = 'rascunho' | 'em_analise' | 'concluido' | 'arquivado';

const statusLabel: Record<DiagStatus, string> = {
  rascunho: 'Rascunho',
  em_analise: 'Em análise',
  concluido: 'Concluído',
  arquivado: 'Arquivado',
};

const statusVariant: Record<DiagStatus, 'secondary' | 'default' | 'outline'> = {
  rascunho: 'secondary',
  em_analise: 'default',
  concluido: 'default',
  arquivado: 'outline',
};

const fmtUsd = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(n);

const fmtMs = (ms: number) => {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${(ms / 60_000).toFixed(1)} min`;
};

const last30DaysIso = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

const AdminHome = () => {
  // Diagnósticos por status
  const diagsQuery = useQuery({
    queryKey: ['admin-metrics', 'diagnosticos-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnosticos')
        .select('status');
      if (error) throw error;
      const counts: Record<DiagStatus, number> = {
        rascunho: 0,
        em_analise: 0,
        concluido: 0,
        arquivado: 0,
      };
      (data ?? []).forEach((row) => {
        const s = row.status as DiagStatus;
        if (s in counts) counts[s] += 1;
      });
      return { total: data?.length ?? 0, counts };
    },
  });

  // Operações de IA últimos 30d
  const opsQuery = useQuery({
    queryKey: ['admin-metrics', 'operacoes-30d'],
    queryFn: async () => {
      const since = last30DaysIso();
      const { data, error } = await supabase
        .from('operacoes_ia')
        .select('created_at, custo_usd, duracao_ms, sucesso, tipo')
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .limit(5000);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Top categorias do RAG (audit_trail_ia.contexto_rag)
  const ragQuery = useQuery({
    queryKey: ['admin-metrics', 'rag-top-categorias'],
    queryFn: async () => {
      const since = last30DaysIso();
      const { data, error } = await supabase
        .from('audit_trail_ia')
        .select('contexto_rag')
        .gte('created_at', since)
        .not('contexto_rag', 'is', null)
        .limit(2000);
      if (error) throw error;
      const counts = new Map<string, number>();
      (data ?? []).forEach((row) => {
        const ctx = row.contexto_rag as unknown;
        const items = Array.isArray(ctx)
          ? ctx
          : Array.isArray((ctx as { matches?: unknown[] })?.matches)
            ? (ctx as { matches: unknown[] }).matches
            : [];
        items.forEach((item) => {
          const cat =
            (item as { categoria?: string | null })?.categoria ||
            'sem categoria';
          counts.set(cat, (counts.get(cat) ?? 0) + 1);
        });
      });
      return Array.from(counts.entries())
        .map(([categoria, total]) => ({ categoria, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    },
  });

  // Contadores rápidos
  const quickQuery = useQuery({
    queryKey: ['admin-metrics', 'quick-counts'],
    queryFn: async () => {
      const [usersRes, knowledgeRes, pdfsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase
          .from('knowledge_base')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'aprovado'),
        supabase.from('relatorios_pdf').select('*', { count: 'exact', head: true }),
      ]);
      return {
        usuarios: usersRes.count ?? 0,
        knowledge: knowledgeRes.count ?? 0,
        pdfs: pdfsRes.count ?? 0,
      };
    },
  });

  // Agregações sobre operações
  const opsAgg = useMemo(() => {
    const ops = opsQuery.data ?? [];
    const byDay = new Map<string, { custo: number; duracao: number; total: number }>();
    let total = 0;
    let sucessos = 0;
    let custoTotal = 0;
    let duracaoTotal = 0;
    ops.forEach((o) => {
      total += 1;
      if (o.sucesso) sucessos += 1;
      custoTotal += Number(o.custo_usd ?? 0);
      duracaoTotal += Number(o.duracao_ms ?? 0);
      const day = (o.created_at as string).slice(0, 10);
      const cur = byDay.get(day) ?? { custo: 0, duracao: 0, total: 0 };
      cur.custo += Number(o.custo_usd ?? 0);
      cur.duracao += Number(o.duracao_ms ?? 0);
      cur.total += 1;
      byDay.set(day, cur);
    });
    // Preencher dias faltantes
    const days: { dia: string; custo: number; duracao_s: number; total: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const v = byDay.get(key) ?? { custo: 0, duracao: 0, total: 0 };
      days.push({
        dia: key.slice(5),
        custo: Number(v.custo.toFixed(6)),
        duracao_s: Number((v.duracao / 1000).toFixed(2)),
        total: v.total,
      });
    }
    return {
      total,
      sucessos,
      taxaSucesso: total > 0 ? (sucessos / total) * 100 : 0,
      custoTotal,
      duracaoTotal,
      days,
    };
  }, [opsQuery.data]);

  const chartConfigCusto: ChartConfig = {
    custo: { label: 'Custo (USD)', color: 'hsl(var(--primary))' },
  };
  const chartConfigDuracao: ChartConfig = {
    duracao_s: { label: 'Duração (s)', color: 'hsl(var(--primary))' },
  };

  const isLoading =
    diagsQuery.isLoading || opsQuery.isLoading || ragQuery.isLoading || quickQuery.isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel administrativo</h1>
        <p className="text-muted-foreground">
          Métricas dos últimos 30 dias e visão geral do sistema.
        </p>
      </div>

      {/* Quick counts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickCard
          title="Usuários"
          value={quickQuery.data?.usuarios ?? 0}
          icon={Users}
          loading={quickQuery.isLoading}
          to="/admin/usuarios"
        />
        <QuickCard
          title="Diagnósticos"
          value={diagsQuery.data?.total ?? 0}
          icon={ClipboardList}
          loading={diagsQuery.isLoading}
          to="/admin/diagnosticos"
        />
        <QuickCard
          title="Knowledge aprovado"
          value={quickQuery.data?.knowledge ?? 0}
          icon={BookOpen}
          loading={quickQuery.isLoading}
          to="/admin/knowledge"
        />
        <QuickCard
          title="PDFs gerados"
          value={quickQuery.data?.pdfs ?? 0}
          icon={FileText}
          loading={quickQuery.isLoading}
        />
      </div>

      {/* Diagnósticos por status + Taxa de sucesso */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Diagnósticos por status</CardTitle>
            <CardDescription>Distribuição atual em todo o sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            {diagsQuery.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(Object.keys(statusLabel) as DiagStatus[]).map((s) => (
                  <div
                    key={s}
                    className="rounded-lg border p-3 flex flex-col gap-1"
                  >
                    <Badge variant={statusVariant[s]} className="w-fit">
                      {statusLabel[s]}
                    </Badge>
                    <span className="text-2xl font-semibold tabular-nums">
                      {diagsQuery.data?.counts[s] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Taxa de sucesso (IA)
            </CardTitle>
            <CardDescription>Operações nos últimos 30 dias.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {opsQuery.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <>
                <div className="text-3xl font-bold tabular-nums">
                  {opsAgg.taxaSucesso.toFixed(1)}%
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {opsAgg.sucessos} ok
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-destructive" />
                    {opsAgg.total - opsAgg.sucessos} falhas
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Total de operações: {opsAgg.total}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Custo e duração */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Custo de IA (USD) — 30d
            </CardTitle>
            <CardDescription>
              Total: <span className="font-medium">{fmtUsd(opsAgg.custoTotal)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {opsQuery.isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ChartContainer config={chartConfigCusto} className="h-[200px] w-full">
                <BarChart data={opsAgg.days}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="dia" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(v) => fmtUsd(Number(v))}
                      />
                    }
                  />
                  <Bar dataKey="custo" fill="var(--color-custo)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Duração de IA (s) — 30d
            </CardTitle>
            <CardDescription>
              Total acumulado:{' '}
              <span className="font-medium">{fmtMs(opsAgg.duracaoTotal)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {opsQuery.isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ChartContainer config={chartConfigDuracao} className="h-[200px] w-full">
                <LineChart data={opsAgg.days}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="dia" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(v) => `${Number(v).toFixed(2)} s`}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="duracao_s"
                    stroke="var(--color-duracao_s)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top categorias RAG */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Top categorias usadas no RAG (30d)
          </CardTitle>
          <CardDescription>
            Categorias do knowledge base mais recuperadas em respostas de IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ragQuery.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (ragQuery.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum uso de RAG registrado nos últimos 30 dias.
            </p>
          ) : (
            <div className="space-y-2">
              {ragQuery.data!.map((row) => {
                const max = ragQuery.data![0].total || 1;
                const pct = (row.total / max) * 100;
                return (
                  <div key={row.categoria} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{row.categoria}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {row.total}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && (diagsQuery.error || opsQuery.error || ragQuery.error || quickQuery.error) && (
        <p className="text-sm text-destructive">
          Falha ao carregar parte das métricas. Tente recarregar a página.
        </p>
      )}
    </div>
  );
};

interface QuickCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  to?: string;
}

const QuickCard = ({ title, value, icon: Icon, loading, to }: QuickCardProps) => {
  const inner = (
    <Card className={to ? 'h-full transition-colors hover:border-primary' : 'h-full'}>
      <CardHeader className="pb-2">
        <Icon className="h-5 w-5 text-primary mb-1" />
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <div className="text-2xl font-bold tabular-nums">{value.toLocaleString('pt-BR')}</div>
        )}
      </CardContent>
    </Card>
  );
  return to ? (
    <Link to={to} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
};

export default AdminHome;
