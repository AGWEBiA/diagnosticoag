import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type Respostas = Record<string, unknown>;

interface DiagnosticoState {
  id: string | null;
  respostas: Respostas;
  segmento: string | null;
  empresa_nome: string | null;
  status: string;
  etapa_atual: number;
}

const EMPTY: DiagnosticoState = {
  id: null,
  respostas: {},
  segmento: null,
  empresa_nome: null,
  status: 'rascunho',
  etapa_atual: 0,
};

export function useDiagnosticoRascunho() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<DiagnosticoState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carrega rascunho mais recente
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('diagnosticos')
        .select('id, respostas, segmento, empresa_nome, status')
        .eq('user_id', user.id)
        .eq('status', 'rascunho')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('Erro ao carregar rascunho:', error);
        toast({ title: 'Erro ao carregar rascunho', description: error.message, variant: 'destructive' });
      }

      if (data) {
        const respostas = (data.respostas as Respostas) ?? {};
        setState({
          id: data.id,
          respostas,
          segmento: data.segmento,
          empresa_nome: data.empresa_nome,
          status: data.status,
          etapa_atual: typeof respostas.__etapa_atual === 'number' ? (respostas.__etapa_atual as number) : 0,
        });
      } else {
        setState(EMPTY);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, toast]);

  // Auto-save por etapa (chamado ao avançar)
  const salvarEtapa = useCallback(
    async (novasRespostas: Respostas, novaEtapa: number) => {
      if (!user) return null;
      setSaving(true);

      const respostasFinal = { ...novasRespostas, __etapa_atual: novaEtapa };
      const segmento =
        typeof novasRespostas.segmento === 'string' ? (novasRespostas.segmento as string) : state.segmento;
      const empresa_nome =
        typeof novasRespostas.empresa_nome === 'string'
          ? (novasRespostas.empresa_nome as string)
          : state.empresa_nome;

      let id = state.id;
      let error;

      if (id) {
        ({ error } = await supabase
          .from('diagnosticos')
          .update({ respostas: respostasFinal, segmento, empresa_nome, status: 'rascunho' })
          .eq('id', id));
      } else {
        const inserted = await supabase
          .from('diagnosticos')
          .insert({
            user_id: user.id,
            respostas: respostasFinal,
            segmento,
            empresa_nome,
            status: 'rascunho',
          })
          .select('id')
          .single();
        error = inserted.error;
        id = inserted.data?.id ?? null;
      }

      setSaving(false);

      if (error) {
        toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
        return null;
      }

      setState((s) => ({
        ...s,
        id,
        respostas: respostasFinal,
        segmento,
        empresa_nome,
        etapa_atual: novaEtapa,
      }));

      return id;
    },
    [user, state.id, state.segmento, state.empresa_nome, toast]
  );

  const finalizar = useCallback(async (): Promise<string | null> => {
    if (!user || !state.id) return null;
    setSaving(true);
    const { error } = await supabase
      .from('diagnosticos')
      .update({ status: 'em_analise' })
      .eq('id', state.id);

    if (error) {
      setSaving(false);
      toast({ title: 'Erro ao finalizar', description: error.message, variant: 'destructive' });
      return null;
    }

    // Dispara processamento IA (RAG + análise)
    const diagId = state.id;
    const { error: fnError } = await supabase.functions.invoke('process-diagnostico', {
      body: { diagnostico_id: diagId },
    });
    setSaving(false);

    if (fnError) {
      toast({
        title: 'Análise IA com erro',
        description: fnError.message + ' — você pode reprocessar depois.',
        variant: 'destructive',
      });
      return diagId; // navega mesmo assim, status fica em_analise
    }

    toast({ title: 'Diagnóstico concluído', description: 'Veja o resultado abaixo.' });
    return diagId;
  }, [user, state.id, toast]);

  const resetar = useCallback(() => setState(EMPTY), []);

  return { state, loading, saving, salvarEtapa, finalizar, resetar };
}
