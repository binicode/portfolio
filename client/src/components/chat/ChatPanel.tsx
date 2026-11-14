'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowRight, ArrowUp, X } from 'lucide-react';
import { getChatHistory, getOrCreateSessionId, streamChatMessage } from '@/lib/ai-chat-client';
import type { ChatMessage, RetrievedSource } from '@/types/chat';
import type { AssistantMode } from './chat-events';
import DiscoveryFlow from './DiscoveryFlow';

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: RetrievedSource[];
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  mode: AssistantMode;
  onModeChange: (mode: AssistantMode) => void;
  /** Discovery's preselected project type; a new nonce restarts discovery with it. */
  seed?: { build: string; nonce: number } | null;
  /** A question to place in the chat box; a new nonce places it again. */
  prompt?: { text: string; nonce: number } | null;
}

const MODES: Array<{ id: AssistantMode; label: string }> = [
  { id: 'chat', label: 'Ask a question' },
  { id: 'discovery', label: 'Plan a project' },
];

// Each suggestion maps to a knowledge-base source (server/src/modules/ai-chat/
// knowledge-base.content.ts), so a first click always gets a grounded answer.
const SUGGESTIONS = ['What stack do you use?', 'What certifications do you have?', 'What is your background?'];

/**
 * Loaded on demand by ChatLauncher. Two modes: chat (per-visitor session id
 * in localStorage, history on first open, streamed answers with retrieved
 * sources) and project discovery (DiscoveryFlow).
 */
export default function ChatPanel({ isOpen, onClose, mode, onModeChange, seed, prompt }: ChatPanelProps) {
  // The panel is only ever mounted in the browser, after the visitor opens
  // it, so reading localStorage during the first render is safe.
  const [sessionId] = useState(getOrCreateSessionId);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // A prefilled question ("Ask how it was built") replaces the draft once
  // per request. Adjusted during render, React's pattern for state that
  // follows a prop, so no effect re-renders the panel.
  // Starts at 0 so a question that opened the panel for the first time is placed too.
  const [placedPrompt, setPlacedPrompt] = useState(0);
  if (prompt && prompt.nonce !== placedPrompt) {
    setPlacedPrompt(prompt.nonce);
    setInput(prompt.text);
  }

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

  // On open, mode switch or a placed question, focus where the visitor acts
  // next: the message box (caret at the end, ready to send), or the current
  // discovery question (marked data-autofocus).
  const promptNonce = prompt?.nonce;
  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'chat') {
      const box = inputRef.current;
      box?.focus();
      box?.setSelectionRange(box.value.length, box.value.length);
    } else {
      panelRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true });
    }
  }, [isOpen, mode, promptNonce]);

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
        content: last.content || 'The assistant is offline. Try again soon.',
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
      ref={panelRef}
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
      <div className="border-b border-border px-5 pb-3 pt-2.5">
        <div className="flex items-center justify-between">
          <h2 id="assistant-title" className="text-sm font-semibold">
            Portfolio assistant
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close assistant"
            className="-mr-2 inline-flex h-9 w-9 items-center justify-center rounded-xs text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
        <div role="group" aria-label="Assistant mode" className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg bg-foreground/[0.06] p-1">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={mode === item.id}
              onClick={() => onModeChange(item.id)}
              className={`h-9 rounded-md text-xs font-medium transition-colors ${
                mode === item.id ? 'bg-card text-foreground shadow-[0_1px_0_0_var(--border)]' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'discovery' ? (
        // Keyed by the seed so "Plan a similar project" re-reads saved
        // progress and applies its preselection.
        <DiscoveryFlow key={seed?.nonce ?? 0} seed={seed?.build} onAsk={() => onModeChange('chat')} />
      ) : (
        <>
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
              Ask about my projects, stack or background. Answers come from my notes, with sources.
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
            <button
              type="button"
              onClick={() => onModeChange('discovery')}
              className="group mt-6 flex w-full items-center gap-3 rounded-lg border border-accent/40 bg-accent/[0.06] px-4 py-3.5 text-left transition-colors hover:border-accent hover:bg-accent/10"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">Planning a project?</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                  Answer a few questions and get a project brief. About 2 minutes.
                </span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-accent transition-transform duration-200 group-hover:translate-x-0.5"
                strokeWidth={1.75}
              />
            </button>
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
                  <p className="ml-1 text-micro leading-snug text-muted-foreground">
                    Sources: {message.sources.map((s) => s.sourceTitle).join(', ')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* After an answer: from learning what I can do to planning the project. */}
      {!isStreaming && messages.some((message) => message.role === 'assistant' && message.content) && (
        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-2">
          <p className="text-xs text-muted-foreground">Have a project in mind?</p>
          <button
            type="button"
            onClick={() => onModeChange('discovery')}
            className="inline-flex h-8 items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent-bright"
          >
            Plan it in 2 minutes
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>
      )}

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
        </>
      )}
    </div>
  );
}
