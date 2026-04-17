import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';

type SessionState = 'checking' | 'valid' | 'invalid';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>('checking');
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // O Supabase processa o token de recovery automaticamente via detectSessionInUrl.
  // Damos até 3s para o evento PASSWORD_RECOVERY chegar; senão consideramos link inválido.
  useEffect(() => {
    let resolved = false;
    const markValid = () => {
      resolved = true;
      setSessionState('valid');
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        markValid();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) markValid();
    });

    const timeout = setTimeout(() => {
      if (!resolved) setSessionState('invalid');
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const validSession = sessionState === 'valid';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'Use pelo menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }
    if (password !== confirm) {
      toast({
        title: 'Senhas não conferem',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    const { error } = await updatePassword(password);
    setSubmitting(false);

    if (error) {
      const msg = error.message?.toLowerCase() ?? '';
      let description = error.message;
      if (msg.includes('different from the old') || msg.includes('same as')) {
        description = 'A nova senha não pode ser igual à anterior. Escolha uma diferente.';
      } else if (msg.includes('pwned') || msg.includes('compromised') || msg.includes('breach')) {
        description = 'Esta senha aparece em vazamentos públicos. Escolha uma senha mais forte e única.';
      } else if (msg.includes('weak') || msg.includes('short')) {
        description = 'Senha fraca. Use ao menos 6 caracteres com letras e números.';
      }
      toast({
        title: 'Erro ao atualizar senha',
        description,
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Senha atualizada com sucesso!' });
    navigate('/', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Nova senha</CardTitle>
          <CardDescription>
            {sessionState === 'checking' && 'Validando link de recuperação...'}
            {sessionState === 'valid' && 'Defina sua nova senha'}
            {sessionState === 'invalid' && 'Link inválido ou expirado'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessionState === 'invalid' ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  O link de recuperação é inválido ou já expirou. Solicite um novo link para continuar.
                </p>
              </div>
              <Link to="/forgot-password" className="block">
                <Button className="w-full">Solicitar novo link</Button>
              </Link>
              <Link to="/login" className="block">
                <Button variant="outline" className="w-full">Voltar ao login</Button>
              </Link>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                autoComplete="new-password"
                disabled={!validSession}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar senha</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={6}
                required
                autoComplete="new-password"
                disabled={!validSession}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting || !validSession}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Atualizar senha
            </Button>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
