import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { AlertTriangle, DollarSign, GitBranch, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const fmtUsd = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(n);

const sinceIso = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

const PRIMARY_MODEL = 'google/gemini-2.5-flash';

const MetricasAdmin = () => {
  const opsQuery = useQuery({
    queryKey: ['admin-metricas', 'operacoes-30d'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operacoes_ia')
        .select('created_at, custo_usd, modelo, sucesso, tipo, duracao_ms')
        .gte('created_at', sinceIso(30))
        .order('created_at', { ascending: true })
        .limit(10000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const auditQuery = useQuery({
    queryKey: ['admin-metricas', 'audit-30d'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_trail_ia')
        .select('created_at, flagged, flag_motivo, modelo, confianca')
        .gte('created_at', sinceIso(30))
        .order('created_at', { ascending: true })
        .limit(10000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const limiteQuery = useQuery({
    queryKey: ['admin-metricas', 'limite-custo-diario'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'ia_alertas')
        .maybeSingle();
      if (error) throw error;
      const v = (data?.value ?? {}) as { custo_diario_limite_usd?: number };
      return Number(v.custo_diario_limite_usd ?? 0);
    },
  });

  const agg = useMemo(() => {
    const ops = opsQuery.data ?? [];
    const audit = auditQuery.data ?? [];

    // por dia
    const byDay = new Map<string, { custo: number; total: number; fallback: number; flagged: number }>();
    const ensure = (k: string) =>
      byDay.get(k) ?? { custo: 0, total: 0, fallback: 0, flagged: 0 };

    let custoTotal = 0;
    let opsTotal = 0;
    let opsSucesso = 0;
    let fallbackCount = 0;
    let process_diag = 0;

    ops.forEach((o) => {
      const day = (o.created_at as string).slice(0, 10);
      const v = ensure(day);
      v.custo += Number(o.custo_usd ?? 0);
      v.total += 1;
      if (o.tipo === 'process_diagnostico') {
        process_diag += 1;
        if (o.modelo && o.modelo !== PRIMARY_MODEL && o.sucesso) {
          v.fallback += 1;
          fallbackCount += 1;
        }
      }
      byDay.set(day, v);
      opsTotal += 1;
      if (o.sucesso) opsSucesso += 1;
      custoTotal += Number(o.custo_usd ?? 0);
    });

    let flaggedTotal = 0;
    const motivoCounts = new Map<string, number>();
    let confSum = 0;
    let confN = 0;
    audit.forEach((a) => {
      const day = (a.created_at as string).slice(0, 10);
      const v = ensure(day);
      if (a.flagged) {
        v.flagged += 1;
        flaggedTotal += 1;
        const m = a.flag_motivo ?? 'sem_motivo';
        // normaliza motivo (remove números)
        const key = m.split('(')[0].trim();
        motivoCounts.set(key, (motivoCounts.get(key) ?? 0) + 1);
      }
      if (typeof a.confianca === 'number') {
        confSum += Number(a.confianca);
        confN += 1;
      }
      byDay.set(day, v);
    });

    const days: { dia: string; custo: number; total: number; fallback: number; flagged: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const v = byDay.get(key) ?? { custo: 0, total: 0, fallback: 0, flagged: 0 };
      days.push({
        dia: key.slice(5),
        custo: Number(v.custo.toFixed(6)),
        total: v.total,
        fallback: v.fallback,
        flagged: v.flagged,
      });
    }

    const taxaFallback = process_diag > 0 ? (fallbackCount / process_diag) * 100 : 0;
    const taxaFlagged = audit.length > 0 ? (flaggedTotal / audit.length) * 100 : 0;
    const taxaSucesso = opsTotal > 0 ? (opsSucesso / opsTotal) * 100 : 0;
    const confMedia = confN > 0 ? confSum / confN : 0;

    const motivos = Array.from(motivoCounts.entries())
      .map(([motivo, total]) => ({ motivo, total }))
      .sort((a, b) => b.total - a.total);

    const hojeKey = today.toISOString().slice(0, 10);
    const custoHoje = byDay.get(hojeKey)?.custo ?? 0;

    return {
      custoTotal,
      custoHoje,
      opsTotal,
      taxaSucesso,
      taxaFallback,
      taxaFlagged,
      confMedia,
      flaggedTotal,
      fallbackCount,
      process_diag,
      days,
      motivos,
    };
  }, [opsQuery.data, auditQuery.data]);

  const isLoading = opsQuery.isLoading || auditQuery.isLoading;

  const chartCusto: ChartConfig = {
    custo: { label: 'Custo (USD)', color: 'hsl(var(--primary))' },
  };
  const chartFlags: ChartConfig = {
    flagged: { label: 'Flagged', color: 'hsl(var(--destructive))' },
    fallback: { label: 'Fallback', color: 'hsl(var(--primary))' },
  };

  const limite = limiteQuery.data ?? 0;
  const limiteAtivo = limite > 0;
  const excedeu = limiteAtivo && agg.custoHoje > limite;
  const proximo = limiteAtivo && !excedeu && agg.custoHoje >= limite * 0.8;
  const percentUso = limiteAtivo ? (agg.custoHoje / limite) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Métricas de IA</h1>
        <p className="text-muted-foreground">
          Custo, fallback, qualidade e auditoria — últimos 30 dias.
        </p>
      </div>

      {limiteAtivo && (excedeu || proximo) && (
        <Alert variant={excedeu ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {excedeu
              ? 'Limite diário de custo de IA excedido'
              : 'Aproximando do limite diário de custo de IA'}
          </AlertTitle>
          <AlertDescription className="space-y-1">
            <p>
              Hoje: <strong>{fmtUsd(agg.custoHoje)}</strong> de{' '}
              <strong>{fmtUsd(limite)}</strong> ({percentUso.toFixed(1)}%).
            </p>
            <p className="text-xs">
              Ajuste o limite em{' '}
              <Link to="/admin/configuracoes" className="underline">
                Configurações → Alertas de IA
              </Link>
              .
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Custo total (30d)"
          value={fmtUsd(agg.custoTotal)}
          icon={DollarSign}
          loading={isLoading}
          hint={
            limiteAtivo
              ? `Hoje: ${fmtUsd(agg.custoHoje)} / ${fmtUsd(limite)}`
              : `Hoje: ${fmtUsd(agg.custoHoje)} • limite não definido`
          }
          tone={excedeu ? 'warning' : 'default'}
        />
        <KpiCard
          title="Taxa de fallback"
          value={`${agg.taxaFallback.toFixed(1)}%`}
          icon={GitBranch}
          loading={isLoading}
          hint={`${agg.fallbackCount} de ${agg.process_diag} análises`}
        />
        <KpiCard
          title="Taxa flagged"
          value={`${agg.taxaFlagged.toFixed(1)}%`}
          icon={ShieldAlert}
          loading={isLoading}
          hint={`${agg.flaggedTotal} respostas marcadas`}
          tone={agg.taxaFlagged > 25 ? 'warning' : 'default'}
        />
        <KpiCard
          title="Confiança média"
          value={agg.confMedia ? agg.confMedia.toFixed(2) : '—'}
          icon={AlertTriangle}
          loading={isLoading}
          hint="0 a 1 (audit_trail_ia)"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custo diário (USD)</CardTitle>
          <CardDescription>
            Soma de custo_usd em operacoes_ia, por dia, últimos 30 dias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <ChartContainer config={chartCusto} className="h-[220px] w-full">
              <BarChart data={agg.days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dia" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={50} />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(v) => fmtUsd(Number(v))} />}
                />
                <Bar dataKey="custo" fill="var(--color-custo)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fallback vs Flagged por dia</CardTitle>
          <CardDescription>
            Quantas análises caíram no modelo de fallback e quantas respostas foram marcadas para revisão.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <ChartContainer config={chartFlags} className="h-[220px] w-full">
              <BarChart data={agg.days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dia" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="fallback" fill="var(--color-fallback)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="flagged" fill="var(--color-flagged)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Motivos de flag</CardTitle>
          <CardDescription>
            Agrupados por tipo (baixa_confianca, fallback_modelo, etc).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : agg.motivos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma resposta flagged nos últimos 30 dias.</p>
          ) : (
            <ul className="divide-y">
              {agg.motivos.map((m) => (
                <li
                  key={m.motivo}
                  className="py-2 flex items-center justify-between text-sm"
                >
                  <span className="font-medium">{m.motivo}</span>
                  <Badge variant="outline" className="tabular-nums">
                    {m.total}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface KpiCardProps {
  title: string;
  value: string;
  hint?: string;
  loading?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'default' | 'warning';
}

const KpiCard = ({ title, value, hint, loading, icon: Icon, tone = 'default' }: KpiCardProps) => (
  <Card className={tone === 'warning' ? 'border-destructive/40' : undefined}>
    <CardHeader className="pb-2">
      <Icon
        className={`h-5 w-5 mb-1 ${tone === 'warning' ? 'text-destructive' : 'text-primary'}`}
      />
      <CardDescription>{title}</CardDescription>
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <>
          <div className="text-2xl font-bold tabular-nums">{value}</div>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </>
      )}
    </CardContent>
  </Card>
);

export default MetricasAdmin;
