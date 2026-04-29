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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { DiagnosticoChat } from '@/components/admin/DiagnosticoChat';
import { DiagnosticoDetalhes, type DiagnosticoAnalise } from '@/components/admin/DiagnosticoDetalhes';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Eye, FileDown, Loader2, Check, X, MessageCircle, Lock, Unlock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PAGE_SIZE = 10;

type DiagStatus =
  | 'rascunho'
  | 'em_analise'
  | 'aguardando_aprovacao'
  | 'liberado'
  | 'reprovado'
  | 'concluido'
  | 'arquivado'
  | 'bloqueado';
type StatusFiltro = 'todos' | DiagStatus;

interface DiagRow {
  id: string;
  user_id: string;
  empresa_nome: string | null;
  segmento: string | null;
  status: DiagStatus;
  score: number | null;
  created_at: string;
  updated_at: string;
  resumo_executivo: string | null;
  recomendacoes: unknown;
  respostas: unknown;
  analise: unknown;
  enviado_em: string | null;
  aprovado_em: string | null;
  liberado_em: string | null;
  sla_horas: number | null;
  notas_admin: string | null;
  bloqueio_motivo?: string | null;
  bloqueado_em?: string | null;
}

const statusVariant: Record<DiagStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  concluido: 'default',
  liberado: 'default',
  em_analise: 'secondary',
  aguardando_aprovacao: 'secondary',
  rascunho: 'outline',
  reprovado: 'destructive',
  arquivado: 'destructive',
  bloqueado: 'destructive',
};

const DiagnosticosAdmin = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<StatusFiltro>('todos');
  const [segmento, setSegmento] = useState('');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<DiagRow | null>(null);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [acting, setActing] = useState<'aprovar' | 'reprovar' | 'bloquear' | 'desbloquear' | null>(null);
  const [motivoReprovar, setMotivoReprovar] = useState('');
  const [reprovarOpen, setReprovarOpen] = useState(false);
  const [motivoBloquear, setMotivoBloquear] = useState('');
  const [bloquearOpen, setBloquearOpen] = useState(false);
  const [whatsapp, setWhatsapp] = useState<Record<string, string>>({});

  const handleGeneratePdf = async () => {
    if (!viewing) return;
    setGeneratingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-pdf-diagnostico', {
        body: { diagnostico_id: viewing.id },
      });
      if (error) throw error;
      const url = (data as { signed_url?: string } | null)?.signed_url;
      const versao = (data as { versao?: number } | null)?.versao;
      if (!url) throw new Error('Sem URL de download');

      // Baixa via fetch+blob para evitar bloqueio de extensões (ERR_BLOCKED_BY_CLIENT)
      // ao acessar *.supabase.co diretamente.
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Falha no download (${resp.status})`);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `diagnostico-${viewing.id}-v${versao ?? 1}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

      toast({
        title: 'PDF gerado',
        description: `Versão ${versao ?? ''} baixada com sucesso.`,
      });
    } catch (e) {
      toast({
        title: 'Erro ao gerar PDF',
        description: e instanceof Error ? e.message : 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

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
          'id, user_id, empresa_nome, segmento, status, score, created_at, updated_at, resumo_executivo, recomendacoes, respostas, analise, enviado_em, aprovado_em, liberado_em, sla_horas, notas_admin, bloqueio_motivo, bloqueado_em',
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

  const analise = (viewing?.analise ?? viewing?.recomendacoes ?? null) as DiagnosticoAnalise | null;

  const refetch = async () => {
    // força recarga
    setViewing(null);
    await new Promise((r) => setTimeout(r, 50));
    window.location.reload();
  };

  const handleAprovar = async () => {
    if (!viewing) return;
    setActing('aprovar');
    const { error } = await supabase.rpc('aprovar_diagnostico', {
      _diagnostico_id: viewing.id,
      _notas: null,
    });
    setActing(null);
    if (error) {
      toast({ title: 'Erro ao aprovar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({
      title: 'Diagnóstico aprovado',
      description: 'Será liberado automaticamente após o SLA mínimo.',
    });
    await refetch();
  };

  const handleReprovar = async () => {
    if (!viewing) return;
    if (motivoReprovar.trim().length < 5) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Mínimo 5 caracteres.',
        variant: 'destructive',
      });
      return;
    }
    setActing('reprovar');
    const { error } = await supabase.rpc('reprovar_diagnostico', {
      _diagnostico_id: viewing.id,
      _motivo: motivoReprovar.trim(),
    });
    setActing(null);
    if (error) {
      toast({ title: 'Erro ao reprovar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Diagnóstico reprovado' });
    setReprovarOpen(false);
    setMotivoReprovar('');
    await refetch();
  };

  const handleBloquear = async () => {
    if (!viewing) return;
    if (motivoBloquear.trim().length < 5) {
      toast({ title: 'Motivo obrigatório', description: 'Mínimo 5 caracteres.', variant: 'destructive' });
      return;
    }
    setActing('bloquear');
    const { error } = await supabase.rpc('bloquear_diagnostico', {
      _diagnostico_id: viewing.id,
      _motivo: motivoBloquear.trim(),
    });
    setActing(null);
    if (error) {
      toast({ title: 'Erro ao bloquear', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Diagnóstico bloqueado', description: 'O cliente perdeu acesso.' });
    setBloquearOpen(false);
    setMotivoBloquear('');
    await refetch();
  };

  const handleDesbloquear = async () => {
    if (!viewing) return;
    if (!confirm('Restaurar o acesso do cliente a este diagnóstico?')) return;
    setActing('desbloquear');
    const { error } = await supabase.rpc('desbloquear_diagnostico', {
      _diagnostico_id: viewing.id,
    });
    setActing(null);
    if (error) {
      toast({ title: 'Erro ao desbloquear', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Acesso restaurado' });
    await refetch();
  };

  const previsaoLiberacao = (d: DiagRow): string => {
    if (!d.enviado_em) return '';
    const previsao =
      new Date(d.enviado_em).getTime() + (d.sla_horas ?? 24) * 3600 * 1000;
    return new Date(previsao).toLocaleString('pt-BR');
  };

  const buildWhatsappLink = (d: DiagRow): string => {
    const phone = (whatsapp[d.user_id] ?? '').replace(/\D/g, '');
    const empresa = d.empresa_nome ?? 'sua empresa';
    const url = `${window.location.origin}/diagnostico/${d.id}`;
    const msg = encodeURIComponent(
      `Olá! Seu diagnóstico estratégico para "${empresa}" está pronto. ` +
        `Acesse: ${url}`,
    );
    return phone
      ? `https://wa.me/${phone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
  };

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
                <SelectItem value="aguardando_aprovacao">Aguardando aprovação</SelectItem>
                <SelectItem value="liberado">Liberado</SelectItem>
                <SelectItem value="reprovado">Reprovado</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="arquivado">Arquivado</SelectItem>
                <SelectItem value="bloqueado">Bloqueado</SelectItem>
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
        <DialogContent className="max-w-5xl">
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
          <div className="flex justify-end">
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleGeneratePdf}
              disabled={generatingPdf}
            >
              {generatingPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              Gerar PDF
            </Button>
            {viewing?.status === 'aguardando_aprovacao' && !viewing.aprovado_em && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleAprovar}
                  disabled={acting !== null}
                >
                  {acting === 'aprovar' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setReprovarOpen(true)}
                  disabled={acting !== null}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reprovar
                </Button>
              </>
            )}
            {viewing && (viewing.status === 'liberado' || viewing.status === 'concluido') && (
              <>
                <Input
                  type="tel"
                  placeholder="WhatsApp (opcional)"
                  className="h-9 w-[180px]"
                  value={whatsapp[viewing.user_id] ?? ''}
                  onChange={(e) =>
                    setWhatsapp((prev) => ({ ...prev, [viewing.user_id]: e.target.value }))
                  }
                />
                <Button size="sm" variant="outline" asChild>
                <a
                  href={buildWhatsappLink(viewing)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </a>
              </Button>
              </>
            )}
            {viewing && viewing.status !== 'bloqueado' && viewing.status !== 'rascunho' && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setBloquearOpen(true)}
                disabled={acting !== null}
              >
                <Lock className="mr-2 h-4 w-4" />
                Bloquear acesso
              </Button>
            )}
            {viewing && viewing.status === 'bloqueado' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDesbloquear}
                disabled={acting !== null}
              >
                {acting === 'desbloquear' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Unlock className="mr-2 h-4 w-4" />
                )}
                Restaurar acesso
              </Button>
            )}
          </div>
          </div>
          {viewing?.status === 'bloqueado' && viewing.bloqueio_motivo && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs">
              <strong>Acesso bloqueado:</strong> {viewing.bloqueio_motivo}
              {viewing.bloqueado_em && (
                <span className="text-muted-foreground">
                  {' '}— {new Date(viewing.bloqueado_em).toLocaleString('pt-BR')}
                </span>
              )}
            </div>
          )}
          {viewing?.status === 'aguardando_aprovacao' && (
            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              {viewing.aprovado_em ? (
                <>
                  ✓ Aprovado em{' '}
                  <strong>{new Date(viewing.aprovado_em).toLocaleString('pt-BR')}</strong>.
                  Liberação automática prevista para{' '}
                  <strong>{previsaoLiberacao(viewing)}</strong>.
                </>
              ) : (
                <>
                  Aguardando sua revisão. Após aprovar, o diagnóstico só será liberado ao
                  cliente em <strong>{previsaoLiberacao(viewing)}</strong> (SLA de{' '}
                  {viewing.sla_horas ?? 24}h desde o envio).
                </>
              )}
            </div>
          )}
          {viewing?.status === 'reprovado' && viewing.notas_admin && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs">
              <strong>Reprovado:</strong> {viewing.notas_admin}
            </div>
          )}
          <Tabs defaultValue="analise" className="w-full">
            <TabsList>
              <TabsTrigger value="analise">Análise completa</TabsTrigger>
              <TabsTrigger value="chat">Chat IA</TabsTrigger>
              <TabsTrigger value="raw">Respostas brutas</TabsTrigger>
            </TabsList>
            <TabsContent value="analise" className="max-h-[70vh] overflow-auto pr-2">
              {viewing && (
                <DiagnosticoDetalhes
                  resumoExecutivo={viewing.resumo_executivo}
                  score={viewing.score}
                  analise={analise}
                />
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

      <Dialog open={reprovarOpen} onOpenChange={setReprovarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprovar diagnóstico</DialogTitle>
            <DialogDescription>
              Informe o motivo da reprovação (mín. 5 caracteres). O diagnóstico não será
              liberado ao cliente.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            value={motivoReprovar}
            onChange={(e) => setMotivoReprovar(e.target.value)}
            placeholder="Ex.: Inconsistências nas respostas, dados insuficientes..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReprovarOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReprovar}
              disabled={acting === 'reprovar'}
            >
              {acting === 'reprovar' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar reprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bloquearOpen} onOpenChange={setBloquearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear acesso ao diagnóstico</DialogTitle>
            <DialogDescription>
              Use em casos de reembolso ou chargeback. O cliente perde acesso imediatamente
              à página premium e ao PDF.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            value={motivoBloquear}
            onChange={(e) => setMotivoBloquear(e.target.value)}
            placeholder="Ex.: Reembolso solicitado pelo cliente em XX/XX, chargeback Hotmart..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBloquearOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleBloquear}
              disabled={acting === 'bloquear'}
            >
              {acting === 'bloquear' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar bloqueio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiagnosticosAdmin;
