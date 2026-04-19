import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';

// ---------- Tipos espelhando o tool schema do process-diagnostico ----------
interface SwotData {
  forcas?: string[];
  fraquezas?: string[];
  oportunidades?: string[];
  ameacas?: string[];
}
interface Gargalo {
  titulo?: string;
  descricao?: string;
  causa_raiz?: string;
  impacto_no_negocio?: string;
}
interface Recomendacao {
  numero?: number;
  titulo?: string;
  categoria?: string;
  contexto?: string;
  plano_acao?: string[];
  kpi_sucesso?: string;
  prazo?: string;
  esforco?: string;
  impacto?: string;
  prioridade?: string;
  // legado
  descricao?: string;
}
interface RoadmapItem {
  titulo?: string;
  descricao?: string;
  kpi?: string;
}
interface Roadmap {
  dias_90?: RoadmapItem[];
  dias_180?: RoadmapItem[];
  dias_365?: RoadmapItem[];
}
interface Kpi {
  nome?: string;
  valor_atual_estimado?: string;
  meta?: string;
  como_medir?: string;
}
interface Risco {
  titulo?: string;
  probabilidade?: string;
  impacto?: string;
  mitigacao?: string;
}

interface MaturidadeAreas {
  aquisicao?: number;
  conversao?: number;
  retencao?: number;
  operacional?: number;
  financeiro?: number;
}

export interface DiagnosticoAnalise {
  diagnostico_narrativo?: string;
  classificacao_maturidade?: string;
  maturidade_areas?: MaturidadeAreas;
  swot?: SwotData;
  gargalos_principais?: Gargalo[];
  recomendacoes?: Recomendacao[];
  roadmap?: Roadmap;
  kpis_monitorar?: Kpi[];
  riscos?: Risco[];
  proximo_passo_imediato?: string;
}

// ---------- Utils ----------
const prioridadeVariant = (p?: string): 'destructive' | 'default' | 'secondary' | 'outline' => {
  if (!p) return 'outline';
  const x = p.toLowerCase();
  if (x.includes('crítica') || x.includes('critica') || x === 'alta') return 'destructive';
  if (x === 'media' || x === 'média') return 'default';
  return 'secondary';
};

const escalaVariant = (v?: string): 'destructive' | 'default' | 'secondary' | 'outline' => {
  if (!v) return 'outline';
  const x = v.toLowerCase();
  if (x === 'alto' || x === 'alta') return 'destructive';
  if (x === 'medio' || x === 'média' || x === 'media') return 'default';
  return 'secondary';
};

// ---------- Subcomponentes visuais ----------
function ScorePanel({ score, maturidade }: { score: number | null; maturidade?: string }) {
  const s = score ?? 0;
  const cor =
    s >= 75 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-500' : s >= 25 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Score de Maturidade
          </span>
          <span className="text-3xl font-bold tabular-nums">{score ?? '—'}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className={`h-full ${cor} transition-all`} style={{ width: `${s}%` }} />
        </div>
        {maturidade && (
          <p className="text-sm font-medium text-foreground/80">{maturidade}</p>
        )}
      </CardContent>
    </Card>
  );
}

function SwotGrid({ swot }: { swot?: SwotData }) {
  if (!swot) return null;
  const blocos: Array<{
    label: string;
    items?: string[];
    classe: string;
    icon: typeof CheckCircle2;
  }> = [
    {
      label: 'Forças',
      items: swot.forcas,
      classe: 'border-emerald-500/30 bg-emerald-500/5',
      icon: CheckCircle2,
    },
    {
      label: 'Fraquezas',
      items: swot.fraquezas,
      classe: 'border-red-500/30 bg-red-500/5',
      icon: XCircle,
    },
    {
      label: 'Oportunidades',
      items: swot.oportunidades,
      classe: 'border-sky-500/30 bg-sky-500/5',
      icon: Lightbulb,
    },
    {
      label: 'Ameaças',
      items: swot.ameacas,
      classe: 'border-amber-500/30 bg-amber-500/5',
      icon: AlertTriangle,
    },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {blocos.map((b) => {
        const Icon = b.icon;
        return (
          <div key={b.label} className={`rounded-lg border p-3 ${b.classe}`}>
            <div className="mb-2 flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <h4 className="text-sm font-semibold">{b.label}</h4>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {(b.items ?? []).map((it, i) => (
                <li key={i} className="leading-snug">
                  • {it}
                </li>
              ))}
              {(!b.items || b.items.length === 0) && <li className="italic">—</li>}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function GargalosList({ gargalos }: { gargalos?: Gargalo[] }) {
  if (!gargalos?.length) return <p className="text-sm text-muted-foreground">Sem gargalos mapeados.</p>;
  return (
    <div className="space-y-3">
      {gargalos.map((g, i) => (
        <Card key={i}>
          <CardContent className="space-y-2 p-4">
            <div className="flex items-start gap-2">
              <Badge variant="destructive" className="mt-0.5">
                {i + 1}
              </Badge>
              <h4 className="text-sm font-semibold leading-snug">{g.titulo ?? '(sem título)'}</h4>
            </div>
            {g.descricao && <p className="text-xs text-muted-foreground">{g.descricao}</p>}
            {g.causa_raiz && (
              <div className="rounded border-l-2 border-amber-500 bg-amber-500/5 p-2 text-xs">
                <span className="font-semibold">Causa-raiz: </span>
                <span className="text-muted-foreground">{g.causa_raiz}</span>
              </div>
            )}
            {g.impacto_no_negocio && (
              <div className="rounded border-l-2 border-red-500 bg-red-500/5 p-2 text-xs">
                <span className="font-semibold">Impacto: </span>
                <span className="text-muted-foreground">{g.impacto_no_negocio}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RecomendacoesList({ recos }: { recos?: Recomendacao[] }) {
  if (!recos?.length) return <p className="text-sm text-muted-foreground">Nenhuma recomendação gerada.</p>;
  return (
    <div className="space-y-3">
      {recos.map((r, i) => (
        <Card key={i}>
          <CardContent className="space-y-2 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {r.numero ?? i + 1}
                </span>
                <h4 className="text-sm font-semibold leading-snug">{r.titulo ?? '(sem título)'}</h4>
              </div>
              <div className="flex flex-wrap gap-1">
                {r.prioridade && (
                  <Badge variant={prioridadeVariant(r.prioridade)} className="text-[10px] uppercase">
                    {r.prioridade}
                  </Badge>
                )}
                {r.prazo && (
                  <Badge variant="outline" className="text-[10px]">
                    {r.prazo}
                  </Badge>
                )}
                {r.categoria && (
                  <Badge variant="secondary" className="text-[10px]">
                    {r.categoria}
                  </Badge>
                )}
              </div>
            </div>
            {(r.contexto ?? r.descricao) && (
              <p className="text-xs text-muted-foreground">{r.contexto ?? r.descricao}</p>
            )}
            {r.plano_acao && r.plano_acao.length > 0 && (
              <div className="rounded border bg-muted/30 p-2">
                <p className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">
                  Plano de ação
                </p>
                <ol className="ml-4 list-decimal space-y-1 text-xs text-foreground/80">
                  {r.plano_acao.map((p, j) => (
                    <li key={j}>{p}</li>
                  ))}
                </ol>
              </div>
            )}
            <div className="flex flex-wrap gap-3 pt-1 text-[11px]">
              {r.kpi_sucesso && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Target className="h-3 w-3" /> {r.kpi_sucesso}
                </span>
              )}
              {r.esforco && (
                <span className="text-muted-foreground">
                  Esforço: <Badge variant={escalaVariant(r.esforco)} className="ml-1 text-[10px]">{r.esforco}</Badge>
                </span>
              )}
              {r.impacto && (
                <span className="text-muted-foreground">
                  Impacto: <Badge variant={escalaVariant(r.impacto)} className="ml-1 text-[10px]">{r.impacto}</Badge>
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RoadmapTimeline({ roadmap }: { roadmap?: Roadmap }) {
  if (!roadmap) return <p className="text-sm text-muted-foreground">Sem roadmap gerado.</p>;
  const fases: Array<{ titulo: string; cor: string; items?: RoadmapItem[] }> = [
    { titulo: '90 dias — Fundação', cor: 'bg-emerald-500', items: roadmap.dias_90 },
    { titulo: '180 dias — Otimização', cor: 'bg-sky-500', items: roadmap.dias_180 },
    { titulo: '365 dias — Escala', cor: 'bg-violet-500', items: roadmap.dias_365 },
  ];
  return (
    <div className="space-y-4">
      {fases.map((f) => (
        <div key={f.titulo}>
          <div className="mb-2 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${f.cor}`} />
            <h4 className="text-sm font-semibold">{f.titulo}</h4>
          </div>
          <div className="ml-1 space-y-2 border-l-2 border-muted pl-4">
            {(f.items ?? []).map((it, i) => (
              <div key={i} className="rounded-md border bg-card p-3">
                <div className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{it.titulo}</p>
                    {it.descricao && <p className="text-xs text-muted-foreground">{it.descricao}</p>}
                    {it.kpi && (
                      <p className="text-[11px]">
                        <span className="font-semibold text-foreground">KPI: </span>
                        <span className="text-muted-foreground">{it.kpi}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {(!f.items || f.items.length === 0) && (
              <p className="text-xs italic text-muted-foreground">—</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function KpisTable({ kpis }: { kpis?: Kpi[] }) {
  if (!kpis?.length) return <p className="text-sm text-muted-foreground">Sem KPIs definidos.</p>;
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>KPI</TableHead>
            <TableHead>Atual</TableHead>
            <TableHead>Meta</TableHead>
            <TableHead className="hidden md:table-cell">Como medir</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kpis.map((k, i) => (
            <TableRow key={i}>
              <TableCell className="text-xs font-medium">{k.nome ?? '—'}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{k.valor_atual_estimado ?? '—'}</TableCell>
              <TableCell className="text-xs text-foreground">{k.meta ?? '—'}</TableCell>
              <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                {k.como_medir ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RiscosList({ riscos }: { riscos?: Risco[] }) {
  if (!riscos?.length) return <p className="text-sm text-muted-foreground">Sem riscos mapeados.</p>;
  return (
    <div className="space-y-2">
      {riscos.map((r, i) => (
        <Card key={i}>
          <CardContent className="space-y-1.5 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h4 className="text-sm font-semibold leading-snug">{r.titulo}</h4>
              <div className="flex gap-1">
                {r.probabilidade && (
                  <Badge variant={escalaVariant(r.probabilidade)} className="text-[10px]">
                    Prob: {r.probabilidade}
                  </Badge>
                )}
                {r.impacto && (
                  <Badge variant={escalaVariant(r.impacto)} className="text-[10px]">
                    Imp: {r.impacto}
                  </Badge>
                )}
              </div>
            </div>
            {r.mitigacao && (
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Mitigação: </span>
                {r.mitigacao}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------- Componente principal ----------
interface Props {
  resumoExecutivo: string | null;
  score: number | null;
  analise: DiagnosticoAnalise | null;
}

export function DiagnosticoDetalhes({ resumoExecutivo, score, analise }: Props) {
  const a = analise ?? {};
  return (
    <div className="space-y-6">
      <ScorePanel score={score} maturidade={a.classificacao_maturidade} />

      {resumoExecutivo && (
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Resumo executivo
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{resumoExecutivo}</p>
        </section>
      )}

      {a.diagnostico_narrativo && (
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Diagnóstico narrativo
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {a.diagnostico_narrativo}
          </p>
        </section>
      )}

      {a.proximo_passo_imediato && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              Próximo passo imediato
            </p>
            <p className="text-sm">{a.proximo_passo_imediato}</p>
          </CardContent>
        </Card>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          SWOT
        </h3>
        <SwotGrid swot={a.swot} />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Gargalos principais
        </h3>
        <GargalosList gargalos={a.gargalos_principais} />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recomendações ({a.recomendacoes?.length ?? 0})
        </h3>
        <RecomendacoesList recos={a.recomendacoes} />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Roadmap 90 / 180 / 365 dias
        </h3>
        <RoadmapTimeline roadmap={a.roadmap} />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          KPIs a monitorar
        </h3>
        <KpisTable kpis={a.kpis_monitorar} />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Riscos
        </h3>
        <RiscosList riscos={a.riscos} />
      </section>
    </div>
  );
}
