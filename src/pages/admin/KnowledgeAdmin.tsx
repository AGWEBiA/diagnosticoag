import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { Plus, Eye, Check, X, Loader2 } from 'lucide-react';

type StatusFilter = 'todos' | 'pendente' | 'aprovado' | 'rejeitado';
const PAGE_SIZE = 10;

interface KnowledgeRow {
  id: string;
  titulo: string;
  conteudo: string;
  categoria: string | null;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  fonte: string | null;
  tags: string[] | null;
  created_at: string;
}

const statusVariant: Record<KnowledgeRow['status'], 'default' | 'secondary' | 'destructive'> = {
  aprovado: 'default',
  pendente: 'secondary',
  rejeitado: 'destructive',
};

const KnowledgeAdmin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<StatusFilter>('todos');
  const [categoria, setCategoria] = useState<string>('todas');
  const [page, setPage] = useState(1);
  const [openCreate, setOpenCreate] = useState(false);
  const [viewing, setViewing] = useState<KnowledgeRow | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [status, categoria]);

  // Distinct categorias for filter dropdown
  const { data: categoriasData } = useQuery({
    queryKey: ['kb-categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('categoria')
        .not('categoria', 'is', null)
        .limit(500);
      if (error) throw error;
      const set = new Set<string>();
      data?.forEach((r) => r.categoria && set.add(r.categoria));
      return Array.from(set).sort();
    },
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['kb-list', status, categoria, page],
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let query = supabase
        .from('knowledge_base')
        .select('id, titulo, conteudo, categoria, status, fonte, tags, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (status !== 'todos') query = query.eq('status', status);
      if (categoria !== 'todas') query = query.eq('categoria', categoria);

      const { data: rows, error, count } = await query;
      if (error) throw error;
      return { rows: (rows ?? []) as KnowledgeRow[], total: count ?? 0 };
    },
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  const updateStatus = async (id: string, newStatus: 'aprovado' | 'rejeitado') => {
    setPendingId(id);
    const { error } = await supabase
      .from('knowledge_base')
      .update({ status: newStatus })
      .eq('id', id);
    setPendingId(null);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }

    // Insert validation log (best-effort)
    const { data: u } = await supabase.auth.getUser();
    if (u?.user?.id) {
      await supabase.from('knowledge_validacao').insert({
        knowledge_id: id,
        decisao: newStatus,
        validado_por: u.user.id,
      });
    }

    toast({ title: newStatus === 'aprovado' ? 'Aprovado' : 'Rejeitado' });
    queryClient.invalidateQueries({ queryKey: ['kb-list'] });
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['kb-list'] });
    queryClient.invalidateQueries({ queryKey: ['kb-categorias'] });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">
            Conteúdos usados pelo RAG nas análises de IA.
          </p>
        </div>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo conhecimento
            </Button>
          </DialogTrigger>
          <CreateKnowledgeDialog
            onClose={() => setOpenCreate(false)}
            onCreated={() => {
              setOpenCreate(false);
              refresh();
            }}
          />
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>Refine por status e categoria.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {(categoriasData ?? []).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
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
                <TableHead>Título</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin inline" />
                  </TableCell>
                </TableRow>
              ) : data?.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum conhecimento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                data?.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium max-w-[300px] truncate">
                      {row.titulo}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {row.categoria ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {new Date(row.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setViewing(row)}
                          title="Ver conteúdo"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateStatus(row.id, 'aprovado')}
                          disabled={row.status === 'aprovado' || pendingId === row.id}
                          title="Aprovar"
                        >
                          <Check className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateStatus(row.id, 'rejeitado')}
                          disabled={row.status === 'rejeitado' || pendingId === row.id}
                          title="Rejeitar"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewing?.titulo}</DialogTitle>
            <DialogDescription className="flex flex-wrap gap-2 pt-1">
              {viewing?.categoria && <Badge variant="outline">{viewing.categoria}</Badge>}
              {viewing && <Badge variant={statusVariant[viewing.status]}>{viewing.status}</Badge>}
              {viewing?.fonte && (
                <span className="text-xs text-muted-foreground">Fonte: {viewing.fonte}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm border rounded-md p-3 bg-muted/30">
            {viewing?.conteudo}
          </div>
          {viewing?.tags && viewing.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {viewing.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface CreateProps {
  onClose: () => void;
  onCreated: () => void;
}

const CreateKnowledgeDialog = ({ onClose, onCreated }: CreateProps) => {
  const { toast } = useToast();
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [fonte, setFonte] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [status, setStatus] = useState<'pendente' | 'aprovado'>('aprovado');
  const [submitting, setSubmitting] = useState(false);

  const tags = useMemo(
    () => tagsRaw.split(',').map((t) => t.trim()).filter(Boolean),
    [tagsRaw]
  );

  const submit = async () => {
    if (!titulo.trim() || !conteudo.trim()) {
      toast({ title: 'Preencha título e conteúdo', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke('ingest-knowledge', {
      body: {
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        categoria: categoria.trim() || null,
        fonte: fonte.trim() || null,
        tags: tags.length > 0 ? tags : null,
        status,
      },
    });
    setSubmitting(false);

    if (error) {
      toast({ title: 'Falha ao ingerir', description: error.message, variant: 'destructive' });
      return;
    }
    if (data?.error) {
      toast({ title: 'Falha ao ingerir', description: data.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Conhecimento adicionado', description: `Provider: ${data?.provider}` });
    setTitulo('');
    setConteudo('');
    setCategoria('');
    setFonte('');
    setTagsRaw('');
    onCreated();
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Novo conhecimento</DialogTitle>
        <DialogDescription>
          Será gerado um embedding via OpenAI e armazenado no banco.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label htmlFor="kb-titulo">Título *</Label>
          <Input
            id="kb-titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={500}
            placeholder="Ex: Estratégias de redução de CAC para SaaS"
          />
        </div>
        <div>
          <Label htmlFor="kb-conteudo">Conteúdo *</Label>
          <Textarea
            id="kb-conteudo"
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            rows={8}
            maxLength={50000}
            placeholder="Conteúdo factual, com fontes..."
          />
          <p className="text-xs text-muted-foreground mt-1">
            {conteudo.length} / 50000 caracteres
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="kb-categoria">Categoria</Label>
            <Input
              id="kb-categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ex: marketing"
            />
          </div>
          <div>
            <Label htmlFor="kb-fonte">Fonte</Label>
            <Input
              id="kb-fonte"
              value={fonte}
              onChange={(e) => setFonte(e.target.value)}
              placeholder="Ex: HBR, 2024"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="kb-tags">Tags (separadas por vírgula)</Label>
          <Input
            id="kb-tags"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="cac, saas, growth"
          />
        </div>
        <div>
          <Label>Status inicial</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as 'pendente' | 'aprovado')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aprovado">Aprovado (visível ao RAG)</SelectItem>
              <SelectItem value="pendente">Pendente (revisar depois)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button onClick={submit} disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar e gerar embedding
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default KnowledgeAdmin;
