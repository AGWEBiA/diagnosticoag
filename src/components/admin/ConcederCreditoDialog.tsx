import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Search, Loader2, UserCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type FoundUser = { id: string; email: string | null; full_name: string | null };

export const ConcederCreditoDialog = () => {
  const { user: adminUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [motivo, setMotivo] = useState('');
  const [searching, setSearching] = useState(false);
  const [granting, setGranting] = useState(false);
  const [found, setFound] = useState<FoundUser | null>(null);
  const [notFound, setNotFound] = useState(false);

  const reset = () => {
    setEmail('');
    setQuantidade(1);
    setMotivo('');
    setFound(null);
    setNotFound(false);
  };

  const buscarUsuario = async () => {
    const q = email.trim().toLowerCase();
    if (!q) return;
    setSearching(true);
    setFound(null);
    setNotFound(false);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .ilike('email', q)
      .maybeSingle();
    setSearching(false);
    if (error) {
      toast({ title: 'Erro ao buscar', description: error.message, variant: 'destructive' });
      return;
    }
    if (!data) {
      setNotFound(true);
      return;
    }
    setFound(data);
  };

  const conceder = async () => {
    if (!found) return;
    if (quantidade < 1 || quantidade > 50) {
      toast({ title: 'Quantidade inválida', description: 'Informe entre 1 e 50.', variant: 'destructive' });
      return;
    }
    setGranting(true);
    const rows = Array.from({ length: quantidade }).map(() => ({
      user_id: found.id,
      origem: 'admin',
      email_comprador: found.email,
      metadata: {
        concedido_por: adminUser?.id ?? null,
        concedido_por_email: adminUser?.email ?? null,
        motivo: motivo.trim() || null,
      },
    }));
    const { error } = await supabase.from('creditos_diagnostico').insert(rows);
    setGranting(false);
    if (error) {
      toast({ title: 'Erro ao conceder', description: error.message, variant: 'destructive' });
      return;
    }
    toast({
      title: 'Crédito(s) concedido(s)',
      description: `${quantidade} crédito(s) para ${found.email}.`,
    });
    queryClient.invalidateQueries({ queryKey: ['admin-creditos'] });
    reset();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Conceder crédito
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Conceder crédito manual</DialogTitle>
          <DialogDescription>
            Busque o usuário por email e conceda créditos de diagnóstico (origem: admin).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="email-busca">Email do usuário</Label>
            <div className="flex gap-2">
              <Input
                id="email-busca"
                type="email"
                placeholder="usuario@exemplo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFound(null);
                  setNotFound(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    buscarUsuario();
                  }
                }}
                disabled={searching || granting}
              />
              <Button
                type="button"
                variant="outline"
                onClick={buscarUsuario}
                disabled={!email.trim() || searching || granting}
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {found && (
            <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
              <UserCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium truncate">{found.full_name || found.email}</p>
                {found.full_name && (
                  <p className="text-xs text-muted-foreground truncate">{found.email}</p>
                )}
              </div>
            </div>
          )}

          {notFound && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-muted-foreground">
                Nenhum usuário encontrado com este email. Verifique se está correto e se o cadastro foi concluído.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade de créditos</Label>
            <Input
              id="quantidade"
              type="number"
              min={1}
              max={50}
              value={quantidade}
              onChange={(e) => setQuantidade(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              disabled={granting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo (opcional)</Label>
            <Textarea
              id="motivo"
              placeholder="Ex: compensação por suporte, brinde de campanha…"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              disabled={granting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={granting}>
            Cancelar
          </Button>
          <Button onClick={conceder} disabled={!found || granting}>
            {granting && <Loader2 className="h-4 w-4 animate-spin" />}
            Conceder {quantidade} crédito{quantidade > 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
