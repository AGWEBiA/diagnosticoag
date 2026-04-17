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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Eye, Loader2 } from 'lucide-react';

const PAGE_SIZE = 20;

type Aba = 'operacoes' | 'audit_trail';
type SucessoFiltro = 'todos' | 'sucesso' | 'erro';

interface OpRow {
  id: string;
  tipo: string;
  modelo: string | null;
  provider: string | null;
  sucesso: boolean;
  duracao_ms: number | null;
  tokens_input: number | null;
  tokens_output: number | null;
  custo_usd: number | null;
  erro: string | null;
  created_at: string;
  diagnostico_id: string | null;
  user_id: string | null;
}

interface TrailRow {
  id: string;
  modelo: string | null;
  flagged: boolean;
  flag_motivo: string | null;
  confianca: number | null;
  prompt: string;
  resposta: string;
  contexto_rag: unknown;
  created_at: string;
  diagnostico_id: string | null;
  user_id: string | null;
}

const LogsIaAdmin = () => {
  const [aba, setAba] = useState<Aba>('operacoes');
  const [tipo, setTipo] = useState('');
  const [sucesso, setSucesso] = useState<SucessoFiltro>('todos');
  const [page, setPage] = useState(1);
  const [viewOp, setViewOp] = useState<OpRow | null>(null);
  const [viewTrail, setViewTrail] = useState<TrailRow | null>(null);

  useEffect(() => {
    setPage(1);
  }, [aba, tipo, sucesso]);

  const ops = useQuery({
    queryKey: ['admin-ops', tipo, sucesso, page],
    enabled: aba === 'operacoes',
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let q = supabase
        .from('operacoes_ia')
        .select(
          'id, tipo, modelo, provider, sucesso, duracao_ms, tokens_input, tokens_output, custo_usd, erro, created_at, diagnostico_id, user_id',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(from, to);
      if (tipo.trim()) q = q.ilike('tipo', `%${tipo.trim()}%`);
      if (sucesso === 'sucesso') q = q.eq('sucesso', true);
      if (sucesso === 'erro') q = q.eq('sucesso', false);
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as OpRow[], total: count ?? 0 };
    },
  });

  const trail = useQuery({
    queryKey: ['admin-trail', page],
    enabled: aba === 'audit_trail',
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from('audit_trail_ia')
        .select(
          'id, modelo, flagged, flag_motivo, confianca, prompt, resposta, contexto_rag, created_at, diagnostico_id, user_id',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { rows: (data ?? []) as TrailRow[], total: count ?? 0 };
    },
  });

  const isLoading = aba === 'operacoes' ? ops.isLoading : trail.isLoading;
  const total =
    aba === 'operacoes' ? ops.data?.total ?? 0 : trail.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Logs de IA</h1>
        <p className="text-sm text-muted-foreground">
          Auditoria de chamadas e respostas da IA.
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant={aba === 'operacoes' ? 'default' : 'outline'} onClick={() => setAba('operacoes')}>
          Operações
        </Button>
        <Button
          variant={aba === 'audit_trail' ? 'default' : 'outline'}
          onClick={() => setAba('audit_trail')}
        >
          Audit trail (prompts/respostas)
        </Button>
      </div>

      {aba === 'operacoes' && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filtros</CardTitle>
              <CardDescription>Refine as operações.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Input
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  placeholder="ex: process-diagnostico"
                  className="w-[240px]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={sucesso} onValueChange={(v) => setSucesso(v as SucessoFiltro)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="sucesso">Sucesso</SelectItem>
                    <SelectItem value="erro">Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="hidden md:table-cell">Modelo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Tokens</TableHead>
                    <TableHead className="hidden lg:table-cell">Duração</TableHead>
                    <TableHead className="hidden xl:table-cell">Custo</TableHead>
                    <TableHead className="hidden md:table-cell">Quando</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <Loader2 className="inline h-5 w-5 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : ops.data?.rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhuma operação encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ops.data?.rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.tipo}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {row.provider ? `${row.provider}/` : ''}
                          {row.modelo ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.sucesso ? 'default' : 'destructive'}>
                            {row.sucesso ? 'sucesso' : 'erro'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs">
                          {(row.tokens_input ?? 0) + (row.tokens_output ?? 0)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs">
                          {row.duracao_ms ? `${row.duracao_ms} ms` : '—'}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-xs">
                          {row.custo_usd != null ? `$${Number(row.custo_usd).toFixed(4)}` : '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {new Date(row.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => setViewOp(row)}>
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
        </>
      )}

      {aba === 'audit_trail' && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Flagged</TableHead>
                  <TableHead className="hidden md:table-cell">Confiança</TableHead>
                  <TableHead className="hidden lg:table-cell">Diagnóstico</TableHead>
                  <TableHead className="hidden md:table-cell">Quando</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="inline h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : trail.data?.rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum registro.
                    </TableCell>
                  </TableRow>
                ) : (
                  trail.data?.rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-xs">{row.modelo ?? '—'}</TableCell>
                      <TableCell>
                        {row.flagged ? (
                          <Badge variant="destructive">flagged</Badge>
                        ) : (
                          <Badge variant="outline">ok</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs">
                        {row.confianca != null ? Number(row.confianca).toFixed(2) : '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {row.diagnostico_id ? row.diagnostico_id.slice(0, 8) : '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {new Date(row.created_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => setViewTrail(row)}>
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
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total} registro{total === 1 ? '' : 's'}
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

      <Dialog open={!!viewOp} onOpenChange={(o) => !o && setViewOp(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewOp?.tipo}</DialogTitle>
            <DialogDescription>
              {viewOp?.provider ? `${viewOp.provider}/` : ''}
              {viewOp?.modelo ?? '—'} · {viewOp && new Date(viewOp.created_at).toLocaleString('pt-BR')}
            </DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Tokens entrada</dt>
              <dd>{viewOp?.tokens_input ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Tokens saída</dt>
              <dd>{viewOp?.tokens_output ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Duração</dt>
              <dd>{viewOp?.duracao_ms ? `${viewOp.duracao_ms} ms` : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Custo (USD)</dt>
              <dd>{viewOp?.custo_usd != null ? `$${Number(viewOp.custo_usd).toFixed(4)}` : '—'}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Diagnóstico</dt>
              <dd className="font-mono text-xs">{viewOp?.diagnostico_id ?? '—'}</dd>
            </div>
          </dl>
          {viewOp?.erro && (
            <div>
              <h4 className="mb-1 text-xs font-semibold">Erro</h4>
              <pre className="max-h-48 overflow-auto rounded-md border bg-destructive/10 p-2 text-xs">
                {viewOp.erro}
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewTrail} onOpenChange={(o) => !o && setViewTrail(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Audit trail{' '}
              {viewTrail?.flagged && <Badge variant="destructive" className="ml-2">flagged</Badge>}
            </DialogTitle>
            <DialogDescription>
              {viewTrail?.modelo ?? '—'} ·{' '}
              {viewTrail && new Date(viewTrail.created_at).toLocaleString('pt-BR')}
              {viewTrail?.confianca != null && ` · confiança ${Number(viewTrail.confianca).toFixed(2)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-auto">
            {viewTrail?.flag_motivo && (
              <div className="rounded-md border bg-destructive/10 p-2 text-sm">
                <strong>Motivo:</strong> {viewTrail.flag_motivo}
              </div>
            )}
            <section>
              <h4 className="mb-1 text-sm font-semibold">Prompt</h4>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-2 text-xs">
                {viewTrail?.prompt}
              </pre>
            </section>
            <section>
              <h4 className="mb-1 text-sm font-semibold">Resposta</h4>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-2 text-xs">
                {viewTrail?.resposta}
              </pre>
            </section>
            <section>
              <h4 className="mb-1 text-sm font-semibold">Contexto RAG</h4>
              <pre className="max-h-48 overflow-auto rounded-md border bg-muted/30 p-2 text-xs">
                {JSON.stringify(viewTrail?.contexto_rag ?? null, null, 2)}
              </pre>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LogsIaAdmin;
