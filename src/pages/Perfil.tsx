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
import { UserAvatarMenu } from '@/components/UserAvatarMenu';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download, Loader2, FileText, ClipboardList, Upload, Trash2, KeyRound, Eye, EyeOff, Coins, ShoppingCart, History } from 'lucide-react';
import { useCreditos } from '@/hooks/useCreditos';
import { PasswordStrength, isPasswordStrong } from '@/components/PasswordStrength';

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
  const { user, updatePassword } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { creditos, loading: creditosLoading } = useCreditos();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const comprasQuery = useQuery({
    queryKey: ['perfil-compras', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creditos_diagnostico')
        .select('id, origem, transacao_externa_id, created_at, consumido_em, diagnostico_id, metadata, produto_id')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Alterar senha
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!isPasswordStrong(newPassword)) {
      toast({
        title: 'Senha fraca',
        description: 'Use ao menos 8 caracteres com maiúscula, número e símbolo.',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Senhas não conferem', description: 'Confirme a nova senha corretamente.', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    const { error } = await updatePassword(newPassword);
    setChangingPassword(false);
    if (error) {
      toast({ title: 'Erro ao alterar senha', description: error.message, variant: 'destructive' });
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
    toast({ title: 'Senha atualizada', description: 'Sua nova senha já está ativa.' });
  };

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

  const handleAvatarFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast({ title: 'Formato inválido', description: 'Use JPG, PNG ou WebP.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast({ title: 'Arquivo muito grande', description: 'Limite: 2 MB.', variant: 'destructive' });
      return;
    }

    setUploadingAvatar(true);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setUploadingAvatar(false);
      toast({ title: 'Falha no upload', description: upErr.message, variant: 'destructive' });
      return;
    }

    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    const { error: updErr } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    setUploadingAvatar(false);
    if (updErr) {
      toast({ title: 'Erro ao salvar avatar', description: updErr.message, variant: 'destructive' });
      return;
    }
    setAvatarUrl(publicUrl);
    toast({ title: 'Avatar atualizado' });
    qc.invalidateQueries({ queryKey: ['perfil', user.id] });
  };

  const handleAvatarRemove = async () => {
    if (!user) return;
    setUploadingAvatar(true);
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id);
    setUploadingAvatar(false);
    if (error) {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
      return;
    }
    setAvatarUrl('');
    toast({ title: 'Avatar removido' });
    qc.invalidateQueries({ queryKey: ['perfil', user.id] });
  };

  const initials = (fullName || user?.email || '?')
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Início
            </Link>
          </Button>
          <UserAvatarMenu />
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
              <form onSubmit={handleSave} className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarFile}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        {avatarUrl ? 'Trocar foto' : 'Enviar foto'}
                      </Button>
                      {avatarUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleAvatarRemove}
                          disabled={uploadingAvatar}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG ou WebP, até 2 MB.
                    </p>
                  </div>
                </div>

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

                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Créditos de diagnóstico */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              Diagnósticos disponíveis
            </CardTitle>
            <CardDescription>Cada diagnóstico finalizado consome 1 saldo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                {creditosLoading ? (
                  <Skeleton className="h-10 w-24" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold tabular-nums">{creditos}</span>
                    <span className="text-sm text-muted-foreground">
                      {creditos === 1 ? 'diagnóstico' : 'diagnósticos'}
                    </span>
                  </div>
                )}
              </div>
              <Button asChild>
                <Link to="/comprar">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Comprar mais diagnósticos
                </Link>
              </Button>
            </div>

            {/* Histórico */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                <History className="h-4 w-4 text-muted-foreground" />
                Histórico de compras
              </div>
              {comprasQuery.isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (comprasQuery.data?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma compra registrada ainda.
                </p>
              ) : (
                <ul className="divide-y rounded-md border">
                  {comprasQuery.data!.map((c) => {
                    const usado = !!c.diagnostico_id;
                    const origemLabel =
                      c.origem === 'cortesia' ? 'Bônus de boas-vindas' :
                      c.origem === 'hotmart' ? 'Hotmart' :
                      c.origem === 'kiwify' ? 'Kiwify' :
                      c.origem === 'admin' ? 'Concedido pelo admin' :
                      c.origem;
                    return (
                      <li key={c.id} className="px-3 py-2 flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{origemLabel}</span>
                            <Badge variant={usado ? 'outline' : 'default'} className="text-[10px]">
                              {usado ? 'Utilizado' : 'Disponível'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(c.created_at).toLocaleDateString('pt-BR')}
                            {c.transacao_externa_id ? ` · #${c.transacao_externa_id.slice(0, 12)}` : ''}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alterar senha */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              Alterar senha
            </CardTitle>
            <CardDescription>Defina uma nova senha de acesso à sua conta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrength password={newPassword} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
              <Button type="submit" disabled={changingPassword || !newPassword || !confirmPassword}>
                {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Atualizar senha
              </Button>
            </form>
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
