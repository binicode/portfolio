'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { getChatHistory, getOrCreateSessionId, streamChatMessage } from '@/lib/ai-chat-client';
import type { ChatMessage, RetrievedSource } from '@/types/chat';
import Button from '@/components/ui/Button';

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
        // A fresh session with no history yet returns an empty array
        // from the server, not an error.
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
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="border-beam fixed bottom-6 right-6 z-50 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-transform duration-200 hover:scale-105 active:scale-95"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? 'Close' : 'Ask AI'}
      </button>

      {isOpen && (
        <div className="animate-fade-in fixed bottom-24 right-6 z-50 flex h-[28rem] w-80 flex-col rounded-[20px] border border-white/10 bg-card shadow-xl shadow-black/40">
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="text-sm text-muted">
                Ask me anything about this portfolio, its projects, or the person behind it.
              </p>
            )}
            {messages.map((message, index) => (
              <div key={index} className={message.role === 'user' ? 'text-right' : 'text-left'}>
                <div
                  className={`inline-block rounded-xl px-3 py-2 text-sm ${
                    message.role === 'user' ? 'bg-primary text-white' : 'bg-surface text-foreground'
                  }`}
                >
                  {message.content || (isStreaming && index === messages.length - 1 ? '…' : '')}
                </div>
                {message.sources && message.sources.length > 0 && (
                  <p className="mt-1 text-xs text-muted">
                    Sources: {message.sources.map((s) => s.sourceTitle).join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 border-t border-white/10 p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Type a message…"
              aria-label="Chat message"
              className="flex-1 resize-none rounded-xl border border-white/10 bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isStreaming}
            />
            <Button onClick={handleSend} disabled={isStreaming || !input.trim()} className="px-3 py-2">
              Send
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
