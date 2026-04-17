import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfileLite {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

/**
 * Busca o profile do usuário logado uma vez e mantém em cache global (react-query).
 * Compartilhado entre headers (Landing, Diagnostico, Agendar, Perfil, Admin).
 */
export function useUserProfile() {
  const { user } = useAuth();

  return useQuery<UserProfileLite | null>({
    queryKey: ['perfil', user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, email')
        .eq('id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as UserProfileLite | null) ?? null;
    },
  });
}

export function getInitials(name: string | null | undefined, fallbackEmail: string | null | undefined): string {
  const source = (name && name.trim()) || (fallbackEmail ?? '?');
  return source
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
