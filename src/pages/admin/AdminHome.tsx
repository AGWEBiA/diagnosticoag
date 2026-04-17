import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, ClipboardList, Users, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const cards = [
  {
    title: 'Knowledge Base',
    description: 'Gerencie a base de conhecimento usada no RAG.',
    icon: BookOpen,
    to: '/admin/knowledge',
  },
  {
    title: 'Diagnósticos',
    description: 'Acompanhe diagnósticos dos usuários.',
    icon: ClipboardList,
    to: '/admin/diagnosticos',
  },
  {
    title: 'Usuários',
    description: 'Veja e atribua roles a usuários.',
    icon: Users,
    to: '/admin/usuarios',
  },
  {
    title: 'Logs de IA',
    description: 'Auditoria de operações de IA.',
    icon: Activity,
    to: '/admin/logs',
  },
];

const AdminHome = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel administrativo</h1>
        <p className="text-muted-foreground">Selecione uma área para gerenciar.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="block">
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <c.icon className="h-6 w-6 text-primary mb-2" />
                <CardTitle className="text-base">{c.title}</CardTitle>
                <CardDescription>{c.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminHome;
