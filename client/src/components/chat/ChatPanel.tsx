'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUp, X } from 'lucide-react';
import { getChatHistory, getOrCreateSessionId, streamChatMessage } from '@/lib/ai-chat-client';
import type { ChatMessage, RetrievedSource } from '@/types/chat';

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: RetrievedSource[];
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Each suggestion maps to a knowledge-base source (server/src/modules/ai-chat/
// knowledge-base.content.ts), so a first click always gets a grounded answer.
const SUGGESTIONS = ['What stack do you use?', 'What certifications do you have?', 'What is your background?'];

/**
 * Loaded on demand by ChatLauncher. Behaviour matches the original widget:
 * per-visitor session id in localStorage, history on first open, streamed
 * answers with retrieved sources.
 */
export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  // The panel is only ever mounted in the browser, after the visitor opens
  // it, so reading localStorage during the first render is safe.
  const [sessionId] = useState(getOrCreateSessionId);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load the visitor's previous thread once, when the panel first mounts.
  useEffect(() => {
    let cancelled = false;
    getChatHistory(sessionId)
      .then((history) => {
        if (cancelled) return;
        setMessages(
          history.messages.map((message: ChatMessage) => ({
            role: message.role,
            content: message.content,
          })),
        );
      })
      .catch(() => {
        // No history yet, or the API is unreachable: start with an empty thread.
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || !sessionId || isStreaming) {
      return;
    }

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }, { role: 'assistant', content: '' }]);
    setInput('');
    setIsStreaming(true);

    const updateLast = (fn: (last: DisplayMessage) => DisplayMessage) =>
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = fn(next[next.length - 1]);
        return next;
      });

    try {
      await streamChatMessage(sessionId, trimmed, (event) => {
        if (event.type === 'token') {
          updateLast((last) => ({ ...last, content: last.content + event.content }));
        } else if (event.type === 'done') {
          updateLast((last) => ({ ...last, sources: event.retrievedSources }));
          setIsStreaming(false);
        } else if (event.type === 'error') {
          updateLast((last) => ({
            ...last,
            content: last.content ? `${last.content}\n\n${event.message}` : event.message,
          }));
          setIsStreaming(false);
        }
      });
    } catch {
      updateLast((last) => ({
        ...last,
        content: last.content || 'The assistant is unreachable right now. Try again in a moment.',
      }));
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  return (
    <div
      id="assistant-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="assistant-title"
      hidden={!isOpen}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      className="theme-ink animate-fade-in fixed bottom-[calc(max(1rem,env(safe-area-inset-bottom))+3.5rem+var(--frame))] right-[calc(0.75rem+var(--frame))] z-40 flex h-[min(34rem,calc(100dvh-7rem-2*var(--frame)))] w-[calc(100vw-1.5rem-2*var(--frame))] flex-col overflow-hidden rounded-xl border border-border shadow-[0_30px_60px_-30px_rgb(0_0_0/0.8)] sm:right-[calc(1.5rem+var(--frame))] sm:w-[24rem]"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div>
          <h2 id="assistant-title" className="text-sm font-semibold">
            Portfolio assistant
          </h2>
          <p className="text-xs text-muted-foreground">Answers from my own notes, with sources.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close assistant"
          className="-mr-2 inline-flex h-9 w-9 items-center justify-center rounded-xs text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-busy={isStreaming}
        className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5"
      >
        {messages.length === 0 && (
          <div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Ask about my projects, the stack behind this site, or my background.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => void send(suggestion)}
                    disabled={!sessionId || isStreaming}
                    className="rounded-xs border border-border px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:border-foreground/50 disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((message, index) => {
          const isUser = message.role === 'user';
          const isPending = isStreaming && index === messages.length - 1 && !message.content;
          return (
            <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className="flex max-w-[85%] flex-col gap-1">
                <p className="sr-only">{isUser ? 'You said' : 'Assistant said'}</p>
                <div
                  className={`whitespace-pre-wrap px-4 py-2.5 text-sm leading-relaxed ${
                    isUser
                      ? 'rounded-2xl rounded-br-sm bg-primary text-primary-foreground'
                      : 'rounded-2xl rounded-bl-sm border border-border bg-card'
                  }`}
                >
                  {isPending ? <span className="text-muted-foreground">Thinking…</span> : message.content}
                </div>
                {message.sources && message.sources.length > 0 && (
                  <p className="ml-1 text-[0.6875rem] leading-snug text-muted-foreground">
                    Sources: {message.sources.map((s) => s.sourceTitle).join(', ')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex items-end gap-2 border-t border-border p-3"
      >
        <label htmlFor="assistant-input" className="sr-only">
          Message
        </label>
        <textarea
          ref={inputRef}
          id="assistant-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask a question"
          disabled={isStreaming}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-lg border border-input bg-transparent px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          aria-label="Send message"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
        >
          <ArrowUp aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
        </button>
      </form>
    </div>
  );
}
