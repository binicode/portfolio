'use client';

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { OPEN_CHAT_EVENT, type AssistantMode, type OpenChatDetail } from './chat-events';

// The panel (and the chat client it imports) is fetched only when a
// visitor shows intent: hover, focus or click on the launcher.
const loadPanel = () => import('./ChatPanel');
const ChatPanel = lazy(loadPanel);

export default function ChatLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [mode, setMode] = useState<AssistantMode>('chat');
  // A project type to preselect in discovery; the nonce makes a repeat
  // request from another button count as new.
  const [seed, setSeed] = useState<{ build: string; nonce: number } | null>(null);
  // A question to place in the chat box, same nonce idea.
  const [prompt, setPrompt] = useState<{ text: string; nonce: number } | null>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  /** The button that opened the panel; focus returns there on close. */
  const openerRef = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    setHasOpened(true);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    const opener = openerRef.current;
    openerRef.current = null;
    opener?.focus();
    // The opener may be gone or hidden (a closed mobile menu): use the launcher.
    if (document.activeElement !== opener) launcherRef.current?.focus();
  }, []);

  useEffect(() => {
    const onRequest = (event: Event) => {
      const detail = (event as CustomEvent<OpenChatDetail | null>).detail;
      if (detail?.mode) setMode(detail.mode);
      if (detail?.build) setSeed((prev) => ({ build: detail.build!, nonce: (prev?.nonce ?? 0) + 1 }));
      if (detail?.question) setPrompt((prev) => ({ text: detail.question!, nonce: (prev?.nonce ?? 0) + 1 }));
      if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
        openerRef.current = document.activeElement;
      }
      open();
    };
    window.addEventListener(OPEN_CHAT_EVENT, onRequest);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onRequest);
  }, [open]);

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onPointerEnter={loadPanel}
        onFocus={loadPanel}
        onClick={() => (isOpen ? close() : open())}
        aria-expanded={isOpen}
        aria-controls={hasOpened ? 'assistant-panel' : undefined}
        className="fixed bottom-[calc(max(1rem,env(safe-area-inset-bottom))+var(--frame))] right-[calc(1rem+var(--frame))] z-40 inline-flex h-11 items-center gap-2.5 rounded-xs bg-accent pl-3.5 pr-4 font-mono text-xs uppercase tracking-[0.04em] text-accent-foreground shadow-[0_10px_30px_-12px_rgb(0_0_0/0.8)] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 sm:right-[calc(1.5rem+var(--frame))]"
      >
        <span aria-hidden="true" className="h-1.5 w-1.5 bg-accent-foreground" />
        {isOpen ? (
          'Close'
        ) : (
          <>
            <span className="sm:hidden">Ask AI</span>
            <span className="hidden sm:inline">Ask the assistant</span>
          </>
        )}
      </button>

      {hasOpened && (
        <Suspense fallback={null}>
          <ChatPanel isOpen={isOpen} onClose={close} mode={mode} onModeChange={setMode} seed={seed} prompt={prompt} />
        </Suspense>
      )}
    </>
  );
}
