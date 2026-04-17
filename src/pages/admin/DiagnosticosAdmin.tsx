import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiagnosticoChat } from '@/components/admin/DiagnosticoChat';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Eye, Loader2 } from 'lucide-react';

const PAGE_SIZE = 10;

type StatusFiltro = 'todos' | 'rascunho' | 'em_analise' | 'concluido' | 'arquivado';

interface DiagRow {
  id: string;
  user_id: string;
  empresa_nome: string | null;
  segmento: string | null;
  status: 'rascunho' | 'em_analise' | 'concluido' | 'arquivado';
  score: number | null;
  created_at: string;
  updated_at: string;
  resumo_executivo: string | null;
  recomendacoes: unknown;
  respostas: unknown;
}

const statusVariant: Record<DiagRow['status'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
  concluido: 'default',
  em_analise: 'secondary',
  rascunho: 'outline',
  arquivado: 'destructive',
};

const DiagnosticosAdmin = () => {
  const [status, setStatus] = useState<StatusFiltro>('todos');
  const [segmento, setSegmento] = useState('');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<DiagRow | null>(null);
  const [emails, setEmails] = useState<Record<string, string>>({});

  useEffect(() => {
    setPage(1);
  }, [status, segmento]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-diags', status, segmento, page],
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let q = supabase
        .from('diagnosticos')
        .select(
          'id, user_id, empresa_nome, segmento, status, score, created_at, updated_at, resumo_executivo, recomendacoes, respostas',
          { count: 'exact' }
        )
        .order('updated_at', { ascending: false })
        .range(from, to);
      if (status !== 'todos') q = q.eq('status', status);
      if (segmento.trim()) q = q.ilike('segmento', `%${segmento.trim()}%`);
      const { data: rows, error, count } = await q;
      if (error) throw error;
      return { rows: (rows ?? []) as DiagRow[], total: count ?? 0 };
    },
  });

  // Busca emails dos usuários listados (best-effort)
  useEffect(() => {
    if (!data?.rows.length) return;
    const ids = Array.from(new Set(data.rows.map((r) => r.user_id))).filter(
      (id) => !(id in emails)
    );
    if (ids.length === 0) return;
    (async () => {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', ids);
      if (profs) {
        setEmails((prev) => {
          const next = { ...prev };
          profs.forEach((p) => {
            next[p.id] = p.email ?? '';
          });
          return next;
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.rows]);

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  const recos = (viewing?.recomendacoes ?? []) as Array<{
    titulo?: string;
    descricao?: string;
    impacto?: string;
    prioridade?: number;
  }>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Diagnósticos</h1>
        <p className="text-sm text-muted-foreground">
          Todos os diagnósticos enviados pelos usuários.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>Refine por status e segmento.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusFiltro)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="em_analise">Em análise</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="arquivado">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Segmento (busca)</Label>
            <Input
              value={segmento}
              onChange={(e) => setSegmento(e.target.value)}
              placeholder="ex: infoprodutor"
              className="w-[220px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead className="hidden md:table-cell">Usuário</TableHead>
                <TableHead className="hidden md:table-cell">Segmento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Score</TableHead>
                <TableHead className="hidden lg:table-cell">Atualizado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="inline h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : data?.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum diagnóstico encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                data?.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.empresa_nome || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {emails[row.user_id] ?? row.user_id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {row.segmento ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{row.score ?? '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {new Date(row.updated_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => setViewing(row)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {data?.total ?? 0} resultado{(data?.total ?? 0) === 1 ? '' : 's'}
          {isFetching && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
        </span>
        {totalPages > 1 && (
          <Pagination className="m-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  {page} / {totalPages}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {viewing?.empresa_nome || 'Diagnóstico'}{' '}
              {viewing && (
                <Badge variant={statusVariant[viewing.status]} className="ml-2">
                  {viewing.status}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {viewing?.segmento ?? 'sem segmento'} ·{' '}
              {viewing?.user_id && (emails[viewing.user_id] ?? viewing.user_id.slice(0, 8))}
              {viewing?.score != null && ` · score ${viewing.score}`}
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="resumo" className="w-full">
            <TabsList>
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="chat">Chat IA</TabsTrigger>
              <TabsTrigger value="raw">Respostas</TabsTrigger>
            </TabsList>
            <TabsContent value="resumo" className="max-h-[70vh] space-y-4 overflow-auto">
              {viewing?.resumo_executivo ? (
                <section>
                  <h3 className="mb-1 text-sm font-semibold">Resumo executivo</h3>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {viewing.resumo_executivo}
                  </p>
                </section>
              ) : (
                <p className="text-sm text-muted-foreground">Sem resumo executivo gerado ainda.</p>
              )}
              {recos.length > 0 && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold">Recomendações</h3>
                  <ol className="space-y-2">
                    {recos.map((r, i) => (
                      <li key={i} className="rounded-md border p-2 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">
                            {r.prioridade ?? i + 1}. {r.titulo ?? '(sem título)'}
                          </span>
                          {r.impacto && (
                            <Badge variant="outline" className="text-xs">
                              {r.impacto}
                            </Badge>
                          )}
                        </div>
                        {r.descricao && (
                          <p className="mt-1 text-xs text-muted-foreground">{r.descricao}</p>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </TabsContent>
            <TabsContent value="chat">
              {viewing && <DiagnosticoChat diagnosticoId={viewing.id} />}
            </TabsContent>
            <TabsContent value="raw">
              <pre className="max-h-[60vh] overflow-auto rounded-md border bg-muted/30 p-2 text-xs">
                {JSON.stringify(viewing?.respostas ?? {}, null, 2)}
              </pre>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiagnosticosAdmin;
