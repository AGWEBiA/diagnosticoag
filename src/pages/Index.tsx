import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Shield } from 'lucide-react';

const Index = () => {
  const { user, roles, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold">Meu App</h1>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">E-mail:</span>{' '}
              <span className="text-muted-foreground">{user?.email}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium">User ID:</span>{' '}
              <span className="font-mono text-xs text-muted-foreground">{user?.id}</span>
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Roles:</span>
              <span className="text-sm text-muted-foreground">
                {roles.length > 0 ? roles.join(', ') : 'nenhum'}
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
