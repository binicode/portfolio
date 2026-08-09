'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { getChatHistory, getOrCreateSessionId, streamChatMessage } from '@/lib/ai-chat-client';
import type { ChatMessage, RetrievedSource } from '@/types/chat';

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: RetrievedSource[];
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || historyLoaded) {
      return;
    }

    const id = getOrCreateSessionId();
    setSessionId(id);
    setHistoryLoaded(true);

    getChatHistory(id)
      .then((history) => {
        setMessages(
          history.messages.map((message: ChatMessage) => ({
            role: message.role,
            content: message.content,
          })),
        );
      })
      .catch(() => {
      });
  }, [isOpen, historyLoaded]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || !sessionId || isStreaming) {
      return;
    }

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      await streamChatMessage(sessionId, trimmed, (event) => {
        if (event.type === 'token') {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            next[next.length - 1] = { ...last, content: last.content + event.content };
            return next;
          });
        } else if (event.type === 'done') {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            next[next.length - 1] = { ...last, sources: event.retrievedSources };
            return next;
          });
          setIsStreaming(false);
        } else if (event.type === 'error') {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            next[next.length - 1] = {
              ...last,
              content: last.content ? `${last.content}\n\n_${event.message}_` : event.message,
            };
            return next;
          });
          setIsStreaming(false);
        }
      });
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        next[next.length - 1] = {
          ...last,
          content: last.content || 'Unable to reach the server. Please try again in a moment.',
        };
        return next;
      });
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <div className="absolute -inset-1 animate-pulse rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 opacity-70 blur-md transition-all duration-500 hover:opacity-100" />
        )}

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="group relative flex items-center gap-3 rounded-full border border-white/10 bg-black p-3 pr-5 text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-inner">
            {isOpen ? (
              <svg className="h-4 w-4 fill-current transition-transform duration-300 group-hover:rotate-90" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 fill-current transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
            )}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold leading-none text-white">
              {isOpen ? 'Close' : 'Ask AI'}
            </span>
            {!isOpen && (
              <span className="mt-1 text-[10px] font-medium leading-tight text-violet-400">
                Online & Ready
              </span>
            )}
          </div>
        </button>
      </div>

      {isOpen && (
        <div className="animate-fade-in fixed bottom-24 right-6 z-50 flex h-[32rem] w-[22rem] sm:w-[24rem] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-black/90 text-slate-200 shadow-2xl shadow-violet-900/20 backdrop-blur-xl">

          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500">
                <svg className="h-3.5 w-3.5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-white tracking-wide">AI Assistant</span>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            {messages.length === 0 && (
              <div className="mt-10 flex flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                  <svg className="h-6 w-6 fill-violet-400" viewBox="0 0 24 24">
                    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400 max-w-[80%] leading-relaxed">
                  Hi! Ask me anything about this portfolio, the tech stack, or the person behind it.
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex flex-col gap-1 max-w-[85%]`}>
                  <div
                    className={`inline-block px-4 py-2.5 text-sm leading-relaxed shadow-sm ${message.role === 'user'
                        ? 'bg-gradient-to-tr from-violet-600 to-indigo-500 text-white rounded-2xl rounded-br-sm'
                        : 'bg-white/10 border border-white/5 text-slate-200 rounded-2xl rounded-bl-sm'
                      }`}
                  >
                    {message.content || (isStreaming && index === messages.length - 1 ? (
                      <span className="animate-pulse">Typing...</span>
                    ) : '')}
                  </div>

                  {message.sources && message.sources.length > 0 && (
                    <p className="text-[10px] text-slate-500 ml-1">
                      Sources: {message.sources.map((s) => s.sourceTitle).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 bg-black/50 p-4">
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Type a message…"
                aria-label="Chat message"
                className="max-h-32 flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 transition-all focus:border-violet-500/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-violet-500/10 scrollbar-thin"
                disabled={isStreaming}
              />

              <button
                onClick={handleSend}
                disabled={isStreaming || !input.trim()}
                className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <svg className="h-5 w-5 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
}