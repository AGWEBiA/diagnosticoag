import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Coins, Search, Filter } from 'lucide-react';

type CreditoRow = {
  id: string;
  user_id: string;
  origem: string;
  email_comprador: string | null;
  transacao_externa_id: string | null;
  produto_id: string | null;
  diagnostico_id: string | null;
  consumido_em: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
  produto?: { nome: string | null; gateway: string | null } | null;
  profile?: { email: string | null; full_name: string | null } | null;
};

const origemLabel = (o: string) =>
  o === 'cortesia' ? 'Bônus' :
  o === 'hotmart' ? 'Hotmart' :
  o === 'kiwify' ? 'Kiwify' :
  o === 'admin' ? 'Admin' : o;

const CreditosAdmin = () => {
  const [origem, setOrigem] = useState<string>('todos');
  const [status, setStatus] = useState<'todos' | 'disponivel' | 'usado'>('todos');
  const [busca, setBusca] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-creditos'],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('creditos_diagnostico')
        .select(`
          id, user_id, origem, email_comprador, transacao_externa_id,
          produto_id, diagnostico_id, consumido_em, created_at, metadata,
          produto:produtos_pagamento(nome, gateway)
        `)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;

      const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id).filter(Boolean)));
      let profilesMap = new Map<string, { email: string | null; full_name: string | null }>();
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);
        profilesMap = new Map((profs ?? []).map((p) => [p.id, { email: p.email, full_name: p.full_name }]));
      }

      return (rows ?? []).map((r) => ({
        ...r,
        profile: profilesMap.get(r.user_id) ?? null,
      })) as CreditoRow[];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = busca.trim().toLowerCase();
    return data.filter((r) => {
      if (origem !== 'todos' && r.origem !== origem) return false;
      if (status === 'disponivel' && r.diagnostico_id) return false;
      if (status === 'usado' && !r.diagnostico_id) return false;
      if (q) {
        const haystack = [
          r.email_comprador ?? '',
          r.profile?.email ?? '',
          r.profile?.full_name ?? '',
          r.transacao_externa_id ?? '',
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [data, origem, status, busca]);

  const stats = useMemo(() => {
    const all = data ?? [];
    return {
      total: all.length,
      disponiveis: all.filter((r) => !r.diagnostico_id).length,
      usados: all.filter((r) => !!r.diagnostico_id).length,
      pagos: all.filter((r) => r.origem !== 'cortesia').length,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Coins className="h-6 w-6 text-primary" />
          Créditos de diagnóstico
        </h1>
        <p className="text-muted-foreground text-sm">
          Histórico completo de créditos: origem, comprador e status de uso.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Disponíveis', value: stats.disponiveis },
          { label: 'Utilizados', value: stats.usados },
          { label: 'Pagos', value: stats.pagos },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold tabular-nums mt-1">
                {isLoading ? '…' : s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
          <CardDescription>Combine filtros para encontrar créditos específicos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origem">Origem / Gateway</Label>
              <Select value={origem} onValueChange={setOrigem}>
                <SelectTrigger id="origem"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="hotmart">Hotmart</SelectItem>
                  <SelectItem value="kiwify">Kiwify</SelectItem>
                  <SelectItem value="cortesia">Bônus (cortesia)</SelectItem>
                  <SelectItem value="admin">Concedido pelo admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="disponivel">Disponível (não usado)</SelectItem>
                  <SelectItem value="usado">Utilizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="busca">Buscar por email ou transação</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="busca"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="email@exemplo.com ou ID"
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isLoading ? 'Carregando…' : `${filtered.length} crédito(s)`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <Skeleton className="h-40 w-full" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">Nenhum crédito encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Origem</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Transação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const usado = !!r.diagnostico_id;
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <Badge variant="secondary">{origemLabel(r.origem)}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          <div className="text-sm truncate">
                            {r.profile?.full_name || r.profile?.email || r.email_comprador || '—'}
                          </div>
                          {(r.profile?.email && r.profile.email !== r.email_comprador) && (
                            <div className="text-xs text-muted-foreground truncate">
                              {r.profile.email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {r.produto?.nome ?? <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          {r.transacao_externa_id ? (
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {r.transacao_externa_id.slice(0, 16)}
                            </code>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={usado ? 'outline' : 'default'}>
                            {usado ? 'Utilizado' : 'Disponível'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(r.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditosAdmin;
