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

  // Session id + history load only once the widget is actually opened —
  // no reason to hit the API for a visitor who never interacts with it.
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
        // from the server, not an error — a genuine failure here (e.g.
        // server unreachable) just means the widget opens with no
        // history rather than blocking the visitor from typing.
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

    // Placeholder assistant message, filled in token-by-token as the
    // stream arrives.
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
        className="fixed bottom-6 right-6 z-50 rounded-full bg-black px-5 py-3 text-sm font-medium text-white shadow-lg hover:bg-gray-800"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? 'Close' : 'Ask AI'}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[28rem] w-80 flex-col rounded-lg border bg-white shadow-xl">
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="text-sm text-gray-400">
                Ask me anything about this portfolio, its projects, or the person behind it.
              </p>
            )}
            {messages.map((message, index) => (
              <div key={index} className={message.role === 'user' ? 'text-right' : 'text-left'}>
                <div
                  className={`inline-block rounded-lg px-3 py-2 text-sm ${
                    message.role === 'user' ? 'bg-black text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.content || (isStreaming && index === messages.length - 1 ? '…' : '')}
                </div>
                {message.sources && message.sources.length > 0 && (
                  <p className="mt-1 text-xs text-gray-400">
                    Sources: {message.sources.map((s) => s.sourceTitle).join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 border-t p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Type a message…"
              className="flex-1 resize-none rounded-md border px-3 py-2 text-sm focus:outline-none"
              disabled={isStreaming}
            />
            <button
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
              className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}