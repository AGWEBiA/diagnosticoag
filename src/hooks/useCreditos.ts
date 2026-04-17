import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useCreditos() {
  const { user } = useAuth();
  const [creditos, setCreditos] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const recarregar = useCallback(async () => {
    if (!user) {
      setCreditos(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc('creditos_disponiveis', { _user_id: user.id });
    if (!error && typeof data === 'number') setCreditos(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { creditos, loading, recarregar };
}
