import { useState, useEffect, FormEvent, useRef, ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download, Loader2, FileText, ClipboardList, Upload, Trash2 } from 'lucide-react';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type DiagStatus = 'rascunho' | 'em_analise' | 'concluido' | 'arquivado';

const statusLabel: Record<DiagStatus, string> = {
  rascunho: 'Rascunho',
  em_analise: 'Em análise',
  concluido: 'Concluído',
  arquivado: 'Arquivado',
};

const statusVariant: Record<DiagStatus, 'secondary' | 'default' | 'outline'> = {
  rascunho: 'secondary',
  em_analise: 'default',
  concluido: 'default',
  arquivado: 'outline',
};

const Perfil = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ['perfil', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, email')
        .eq('id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profileQuery.data) {
      setFullName(profileQuery.data.full_name ?? '');
      setAvatarUrl(profileQuery.data.avatar_url ?? '');
    }
  }, [profileQuery.data]);

  const diagsQuery = useQuery({
    queryKey: ['perfil-diagnosticos', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnosticos')
        .select('id, status, segmento, empresa_nome, score, created_at, concluido_em')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const pdfsQuery = useQuery({
    queryKey: ['perfil-pdfs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relatorios_pdf')
        .select('id, diagnostico_id, storage_path, versao, created_at, tamanho_bytes')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Perfil atualizado' });
    qc.invalidateQueries({ queryKey: ['perfil', user.id] });
  };

  const handleDownload = async (id: string, storagePath: string) => {
    setDownloadingId(id);
    const { data, error } = await supabase.storage
      .from('relatorios')
      .createSignedUrl(storagePath, 60);
    setDownloadingId(null);
    if (error || !data?.signedUrl) {
      toast({
        title: 'Não foi possível gerar link',
        description: error?.message ?? 'Tente novamente.',
        variant: 'destructive',
      });
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Início
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Meu perfil</h1>
          <p className="text-muted-foreground">Gerencie seus dados e acesse seus diagnósticos.</p>
        </div>

        {/* Dados pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados pessoais</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
          </CardHeader>
          <CardContent>
            {profileQuery.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome"
                    maxLength={120}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">URL do avatar (opcional)</Label>
                  <Input
                    id="avatarUrl"
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    maxLength={500}
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Diagnósticos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Meus diagnósticos
            </CardTitle>
            <CardDescription>Histórico de análises realizadas.</CardDescription>
          </CardHeader>
          <CardContent>
            {diagsQuery.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (diagsQuery.data?.length ?? 0) === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Você ainda não tem diagnósticos.
                </p>
                <Button asChild>
                  <Link to="/diagnostico">Fazer meu primeiro diagnóstico</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y">
                {diagsQuery.data!.map((d) => {
                  const status = d.status as DiagStatus;
                  return (
                    <li key={d.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>
                          {d.segmento && (
                            <span className="text-xs text-muted-foreground">{d.segmento}</span>
                          )}
                          {typeof d.score === 'number' && (
                            <span className="text-xs font-medium tabular-nums">
                              Score {d.score}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm truncate">
                          {d.empresa_nome ?? 'Diagnóstico sem empresa'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Criado em {new Date(d.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link
                          to={
                            status === 'concluido'
                              ? `/agendar/${d.id}`
                              : '/diagnostico'
                          }
                        >
                          {status === 'concluido' ? 'Agendar' : 'Continuar'}
                        </Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* PDFs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Relatórios em PDF
            </CardTitle>
            <CardDescription>
              Disponibilizados após a reunião de diagnóstico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pdfsQuery.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (pdfsQuery.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum relatório disponível ainda. O PDF é entregue durante a reunião.
              </p>
            ) : (
              <ul className="divide-y">
                {pdfsQuery.data!.map((p) => (
                  <li
                    key={p.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Relatório v{p.versao}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString('pt-BR')}
                        {p.tamanho_bytes
                          ? ` · ${(p.tamanho_bytes / 1024).toFixed(0)} KB`
                          : ''}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(p.id, p.storage_path)}
                      disabled={downloadingId === p.id}
                    >
                      {downloadingId === p.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Baixar
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Perfil;
