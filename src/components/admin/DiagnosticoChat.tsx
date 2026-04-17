import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Msg = { role: 'user' | 'assistant'; content: string };

interface DiagnosticoChatProps {
  diagnosticoId: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-diagnostico`;

export const DiagnosticoChat = ({ diagnosticoId }: DiagnosticoChatProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Carrega histórico
  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from('interacoes_chat')
        .select('role, content')
        .eq('diagnostico_id', diagnosticoId)
        .order('created_at', { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error(error);
      } else if (data) {
        setMessages(
          data
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [diagnosticoId]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setStreaming(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Sessão expirada');

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          diagnostico_id: diagnosticoId,
          messages: next,
        }),
      });

      if (!resp.ok) {
        let errMsg = 'Falha no chat';
        try {
          const j = await resp.json();
          errMsg = j.error ?? errMsg;
        } catch {
          /* ignore */
        }
        if (resp.status === 429) errMsg = 'Muitas requisições. Aguarde alguns segundos.';
        if (resp.status === 402) errMsg = 'Créditos de IA esgotados. Recarregue no workspace.';
        throw new Error(errMsg);
      }
      if (!resp.body) throw new Error('Sem resposta da IA');

      // SSE streaming
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantText = '';
      let started = false;

      const upsertAssistant = (chunk: string) => {
        assistantText += chunk;
        setMessages((prev) => {
          if (!started) {
            started = true;
            return [...prev, { role: 'assistant', content: assistantText }];
          }
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: assistantText };
          return copy;
        });
      };

      let done = false;
      while (!done) {
        const { done: rDone, value } = await reader.read();
        if (rDone) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;
          const j = line.slice(6).trim();
          if (j === '[DONE]') {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(j);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (typeof delta === 'string') upsertAssistant(delta);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro no chat';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
      // reverte mensagem do usuário
      setMessages((prev) => prev.filter((_, i) => !(i === prev.length - 1 && prev[i].role === 'user')));
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex h-[60vh] flex-col rounded-md border">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Chat com IA sobre este diagnóstico</span>
      </div>

      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="space-y-3 p-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma conversa ainda. Faça uma pergunta sobre este diagnóstico.
            </p>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-md px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'ml-8 bg-primary/10 text-foreground'
                    : 'mr-8 bg-muted text-foreground'
                }`}
              >
                <div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">
                  {m.role === 'user' ? 'Você' : 'IA'}
                </div>
                {m.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1">
                    <ReactMarkdown>{m.content || '…'}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            ))
          )}
          {streaming && (
            <div className="text-xs text-muted-foreground">
              <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
              gerando…
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-2">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte algo sobre este diagnóstico…"
            className="min-h-[44px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={streaming}
          />
          <Button onClick={send} disabled={streaming || !input.trim()} size="icon">
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
