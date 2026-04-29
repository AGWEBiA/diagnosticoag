import { Link } from 'react-router-dom';
import { LogOut, User as UserIcon, LayoutDashboard, ClipboardList, Home } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile, getInitials } from '@/hooks/useUserProfile';

interface Props {
  /** Tamanho do avatar em px (default 32). */
  size?: number;
  /** Esconde nome/email ao lado em telas pequenas. */
  compact?: boolean;
}

export const UserAvatarMenu = ({ size = 32, compact = false }: Props) => {
  const { user, signOut, hasRole } = useAuth();
  const { data: profile } = useUserProfile();

  if (!user) return null;

  const name = profile?.full_name ?? null;
  const avatarUrl = profile?.avatar_url ?? null;
  const initials = getInitials(name, user.email ?? null);
  const sizeClass = `h-[${size}px] w-[${size}px]`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto gap-2 px-1.5 py-1">
          <Avatar style={{ height: size, width: size }} className={sizeClass}>
            <AvatarImage src={avatarUrl ?? undefined} alt={name ?? user.email ?? 'Avatar'} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          {!compact && (
            <span className="hidden sm:inline text-sm max-w-[140px] truncate">
              {name ?? user.email}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium truncate">{name ?? 'Minha conta'}</span>
            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/inicio">
            <Home className="mr-2 h-4 w-4" /> Início
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/perfil">
            <UserIcon className="mr-2 h-4 w-4" /> Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/diagnostico">
            <ClipboardList className="mr-2 h-4 w-4" /> Meu diagnóstico
          </Link>
        </DropdownMenuItem>
        {hasRole('admin') && (
          <DropdownMenuItem asChild>
            <Link to="/admin">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
