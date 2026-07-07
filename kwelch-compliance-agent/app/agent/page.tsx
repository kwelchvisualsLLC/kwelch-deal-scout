'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Trash2, Globe, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'How much should I set aside for my next quarterly estimate?',
  'Can I Section 179 a Sony FX3 I bought this year?',
  'Is my $800 CA franchise tax handled for this year?',
  'What does a SEP-IRA save me at my current profit?',
];

/** Tiny markdown → HTML (bold, headers, lists, code, links, tables kept simple). */
function mdToHtml(md: string): string {
  const esc = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let html = esc
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^\s*[-*] (.*)$/gm, '<li>$1</li>')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, '<ul>$1</ul>');
  return html
    .split(/\n{2,}/)
    .map((b) => (b.startsWith('<') ? b : `<p>${b.replace(/\n/g, '<br/>')}</p>`))
    .join('');
}

export default function AgentPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/agent')
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, status]);

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setInput('');
    setBusy(true);
    setStatus(null);
    setMessages((m) => [...m, { role: 'user', content: message }, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
        throw new Error(err.error ?? 'Request failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';
        for (const frame of frames) {
          const eventMatch = frame.match(/^event: (.+)$/m);
          const dataMatch = frame.match(/^data: (.+)$/m);
          if (!eventMatch || !dataMatch) continue;
          const event = eventMatch[1];
          const data = JSON.parse(dataMatch[1]);
          if (event === 'delta') {
            setStatus(null);
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = {
                role: 'assistant',
                content: copy[copy.length - 1].content + data.text,
              };
              return copy;
            });
          } else if (event === 'status') {
            setStatus(data.status);
          } else if (event === 'error') {
            setMessages((m) => {
              const copy = [...m];
              const last = copy[copy.length - 1];
              copy[copy.length - 1] = {
                role: 'assistant',
                content: last.content + `\n\n**Error:** ${data.error}`,
              };
              return copy;
            });
          }
        }
      }
    } catch (e) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: 'assistant',
          content: `**Error:** ${e instanceof Error ? e.message : 'Something went wrong.'}`,
        };
        return copy;
      });
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }

  async function clearHistory() {
    await fetch('/api/agent', { method: 'DELETE' });
    setMessages([]);
  }

  return (
    <div className="flex h-[calc(100vh-9.5rem)] flex-col">
      {/* Header strip */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Globe className="h-3.5 w-3.5 text-gold" />
          Web search enabled — verifies live IRS/FTB deadlines
          <span className="mx-1">·</span>
          <ShieldCheck className="h-3.5 w-3.5 text-gold" />
          Knows your entity, deadlines &amp; QB numbers
        </div>
        {messages.length > 0 && (
          <button onClick={clearHistory} className="flex items-center gap-1 text-xs text-muted hover:text-red">
            <Trash2 className="h-3.5 w-3.5" /> Clear history
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-border bg-card p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-6">
            <div className="text-center">
              <p className="font-display text-lg font-bold text-gold">Your Big 4 partner is on the line.</p>
              <p className="mt-1 text-sm text-muted">
                Senior CPA energy, zero hourly billing. Ask anything about federal or California taxes.
              </p>
            </div>
            <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-lg border border-border bg-input px-3 py-2.5 text-left text-xs text-muted transition-colors hover:border-gold/50 hover:text-text"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed',
                m.role === 'user'
                  ? 'bg-gold/15 text-text'
                  : 'border border-border bg-input text-text',
              )}
            >
              {m.role === 'assistant' ? (
                m.content ? (
                  <div className="chat-md" dangerouslySetInnerHTML={{ __html: mdToHtml(m.content) }} />
                ) : (
                  <span className="flex items-center gap-2 text-muted">
                    <Spinner /> {status ?? 'Thinking…'}
                  </span>
                )
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your tax strategist… (federal + CA, exact dollars)"
          className="flex-1 rounded-lg border border-border bg-input px-4 py-3 text-sm text-text placeholder:text-muted/60 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
          disabled={busy}
        />
        <Button type="submit" disabled={busy || !input.trim()} className="px-5">
          {busy ? <Spinner className="text-black" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
