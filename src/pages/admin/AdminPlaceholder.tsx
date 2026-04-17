import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
}

export const AdminPlaceholder = ({ title, description }: Props) => {
  return (
    <Card>
      <CardHeader>
        <Construction className="h-6 w-6 text-muted-foreground mb-2" />
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description ?? 'Esta área será implementada em breve.'}
        </CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
};

export default AdminPlaceholder;
