import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import type { AppRole } from '@/contexts/AuthContext';

const PAGE_SIZE = 15;
const ROLES: AppRole[] = ['user', 'moderator', 'admin'];

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  roles: AppRole[];
}

const roleVariant: Record<AppRole, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  moderator: 'secondary',
  user: 'outline',
};

const UsuariosAdmin = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-users', search, page],
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let q = supabase
        .from('profiles')
        .select('id, email, full_name, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(`email.ilike.${s},full_name.ilike.${s}`);
      }
      const { data: profs, error, count } = await q;
      if (error) throw error;

      const ids = (profs ?? []).map((p) => p.id);
      let rolesMap: Record<string, AppRole[]> = {};
      if (ids.length) {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', ids);
        rolesMap = (rolesData ?? []).reduce<Record<string, AppRole[]>>((acc, r) => {
          (acc[r.user_id] = acc[r.user_id] || []).push(r.role as AppRole);
          return acc;
        }, {});
      }

      const rows: UserRow[] = (profs ?? []).map((p) => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        created_at: p.created_at,
        roles: rolesMap[p.id] ?? [],
      }));
      return { rows, total: count ?? 0 };
    },
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  const toggleRole = async (userId: string, role: AppRole, hasIt: boolean) => {
    if (userId === currentUser?.id && role === 'admin' && hasIt) {
      toast({
        title: 'Ação bloqueada',
        description: 'Você não pode remover seu próprio papel de admin.',
        variant: 'destructive',
      });
      return;
    }
    const key = `${userId}:${role}`;
    setPendingKey(key);
    let error;
    if (hasIt) {
      ({ error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role));
    } else {
      ({ error } = await supabase.from('user_roles').insert({ user_id: userId, role }));
    }
    setPendingKey(null);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: hasIt ? `Removido: ${role}` : `Adicionado: ${role}` });
    qc.invalidateQueries({ queryKey: ['admin-users'] });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Usuários</h1>
        <p className="text-sm text-muted-foreground">Gerencie roles dos usuários cadastrados.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Buscar</CardTitle>
          <CardDescription>Por nome ou email.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <Label className="text-xs">Busca</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ex: joao@empresa.com"
              className="w-full max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="inline h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : data?.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                data?.rows.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.full_name || <span className="text-muted-foreground">—</span>}
                      {u.id === currentUser?.id && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          você
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 && (
                          <span className="text-xs text-muted-foreground">sem roles</span>
                        )}
                        {u.roles.map((r) => (
                          <Badge key={r} variant={roleVariant[r]} className="text-xs">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {ROLES.map((r) => {
                          const has = u.roles.includes(r);
                          const key = `${u.id}:${r}`;
                          return (
                            <Button
                              key={r}
                              size="sm"
                              variant={has ? 'default' : 'outline'}
                              onClick={() => toggleRole(u.id, r, has)}
                              disabled={pendingKey === key}
                              title={has ? `Remover ${r}` : `Adicionar ${r}`}
                            >
                              {pendingKey === key ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : has ? (
                                <ShieldCheck className="h-3 w-3" />
                              ) : (
                                <ShieldOff className="h-3 w-3" />
                              )}
                              <span className="ml-1 text-xs">{r}</span>
                            </Button>
                          );
                        })}
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
          {data?.total ?? 0} usuário{(data?.total ?? 0) === 1 ? '' : 's'}
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
    </div>
  );
};

export default UsuariosAdmin;
