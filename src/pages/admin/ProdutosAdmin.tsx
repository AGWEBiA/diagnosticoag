import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';

type Gateway = 'hotmart' | 'kiwify' | 'outro';

interface Produto {
  id: string;
  gateway: Gateway;
  produto_externo_id: string;
  oferta_externa_id: string | null;
  nome: string;
  descricao: string | null;
  preco_centavos: number | null;
  moeda: string | null;
  creditos_concedidos: number;
  checkout_url: string | null;
  ativo: boolean;
}

const EMPTY: Omit<Produto, 'id'> = {
  gateway: 'hotmart',
  produto_externo_id: '',
  oferta_externa_id: '',
  nome: '',
  descricao: '',
  preco_centavos: null,
  moeda: 'BRL',
  creditos_concedidos: 1,
  checkout_url: '',
  ativo: true,
};

const ProdutosAdmin = () => {
  const { toast } = useToast();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [precoReais, setPrecoReais] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const carregar = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('produtos_pagamento')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setProdutos((data ?? []) as Produto[]);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const abrirNovo = () => {
    setEditing(null);
    setForm(EMPTY);
    setPrecoReais('');
    setOpen(true);
  };

  const abrirEditar = (p: Produto) => {
    setEditing(p);
    setForm({
      gateway: p.gateway,
      produto_externo_id: p.produto_externo_id,
      oferta_externa_id: p.oferta_externa_id ?? '',
      nome: p.nome,
      descricao: p.descricao ?? '',
      preco_centavos: p.preco_centavos,
      moeda: p.moeda ?? 'BRL',
      creditos_concedidos: p.creditos_concedidos,
      checkout_url: p.checkout_url ?? '',
      ativo: p.ativo,
    });
    setPrecoReais(p.preco_centavos != null ? (p.preco_centavos / 100).toFixed(2) : '');
    setOpen(true);
  };

  const salvar = async () => {
    if (!form.nome.trim() || !form.produto_externo_id.trim()) {
      toast({ title: 'Campos obrigatórios', description: 'Nome e ID externo são obrigatórios.', variant: 'destructive' });
      return;
    }
    if (form.creditos_concedidos < 1) {
      toast({ title: 'Créditos inválidos', description: 'Mínimo 1 crédito.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const cents = precoReais ? Math.round(Number(precoReais.replace(',', '.')) * 100) : null;
    const payload = {
      gateway: form.gateway,
      produto_externo_id: form.produto_externo_id.trim(),
      oferta_externa_id: form.oferta_externa_id?.trim() || null,
      nome: form.nome.trim(),
      descricao: form.descricao?.trim() || null,
      preco_centavos: cents,
      moeda: form.moeda || 'BRL',
      creditos_concedidos: form.creditos_concedidos,
      checkout_url: form.checkout_url?.trim() || null,
      ativo: form.ativo,
    };

    const { error } = editing
      ? await supabase.from('produtos_pagamento').update(payload).eq('id', editing.id)
      : await supabase.from('produtos_pagamento').insert(payload);

    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editing ? 'Produto atualizado' : 'Produto criado' });
    setOpen(false);
    carregar();
  };

  const excluir = async (p: Produto) => {
    if (!confirm(`Excluir "${p.nome}"?`)) return;
    const { error } = await supabase.from('produtos_pagamento').delete().eq('id', p.id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Produto excluído' });
    carregar();
  };

  const formatarPreco = (cents: number | null, moeda: string | null) => {
    if (cents == null) return '—';
    try {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moeda ?? 'BRL' }).format(cents / 100);
    } catch {
      return `${(cents / 100).toFixed(2)}`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Produtos de pagamento</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre cada produto/variação dos gateways (Hotmart, Kiwify) e quantos créditos ele concede.
          </p>
        </div>
        <Button onClick={abrirNovo}>
          <Plus className="mr-2 h-4 w-4" /> Novo produto
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : produtos.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Nenhum produto cadastrado ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>ID externo</TableHead>
                  <TableHead>Oferta</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-center">Créditos</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{p.gateway}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.produto_externo_id}</TableCell>
                    <TableCell className="font-mono text-xs">{p.oferta_externa_id ?? '—'}</TableCell>
                    <TableCell className="text-right">{formatarPreco(p.preco_centavos, p.moeda)}</TableCell>
                    <TableCell className="text-center">{p.creditos_concedidos}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={p.ativo ? 'default' : 'secondary'}>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => abrirEditar(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => excluir(p)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar produto' : 'Novo produto'}</DialogTitle>
            <DialogDescription>
              Preencha os dados conforme aparecem no painel do gateway. O ID externo e a oferta são usados para identificar a compra no webhook.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Nome interno</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex.: Diagnóstico Premium"
              />
            </div>

            <div>
              <Label>Gateway</Label>
              <Select
                value={form.gateway}
                onValueChange={(v) => setForm({ ...form, gateway: v as Gateway })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hotmart">Hotmart</SelectItem>
                  <SelectItem value="kiwify">Kiwify</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Créditos concedidos</Label>
              <Input
                type="number"
                min={1}
                value={form.creditos_concedidos}
                onChange={(e) => setForm({ ...form, creditos_concedidos: Math.max(1, Number(e.target.value)) })}
              />
            </div>

            <div>
              <Label>ID do produto (externo)</Label>
              <Input
                value={form.produto_externo_id}
                onChange={(e) => setForm({ ...form, produto_externo_id: e.target.value })}
                placeholder="ex.: 1234567"
              />
            </div>

            <div>
              <Label>ID da oferta / variação (opcional)</Label>
              <Input
                value={form.oferta_externa_id ?? ''}
                onChange={(e) => setForm({ ...form, oferta_externa_id: e.target.value })}
                placeholder="ex.: oferta-anual"
              />
            </div>

            <div>
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={precoReais}
                onChange={(e) => setPrecoReais(e.target.value)}
                placeholder="Ex.: 297.00"
              />
            </div>

            <div>
              <Label>Moeda</Label>
              <Input
                value={form.moeda ?? 'BRL'}
                onChange={(e) => setForm({ ...form, moeda: e.target.value.toUpperCase() })}
                maxLength={3}
              />
            </div>

            <div className="md:col-span-2">
              <Label>URL de checkout</Label>
              <Input
                type="url"
                value={form.checkout_url ?? ''}
                onChange={(e) => setForm({ ...form, checkout_url: e.target.value })}
                placeholder="https://pay.hotmart.com/..."
              />
            </div>

            <div className="md:col-span-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                rows={2}
                value={form.descricao ?? ''}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                maxLength={500}
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="cursor-pointer">Ativo</Label>
                <p className="text-xs text-muted-foreground">Produtos inativos não aparecem em /comprar.</p>
              </div>
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Salvar alterações' : 'Criar produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProdutosAdmin;
