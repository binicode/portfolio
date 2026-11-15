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
        // A pill, like every call to action: ink on the canvas, bone in the products.
        // Hover lifts it and steps it to rust; nothing fades.
        className="group/launch fixed bottom-[calc(max(1rem,env(safe-area-inset-bottom))+var(--frame))] right-[calc(1rem+var(--frame))] z-40 inline-flex h-12 items-center gap-2.5 rounded-full bg-primary pl-4 pr-5 text-sm font-medium text-primary-foreground shadow-[0_14px_30px_-14px_rgb(11_18_21/0.7)] transition-[transform,background-color,color] duration-200 hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground active:translate-y-0 sm:right-[calc(1.5rem+var(--frame))]"
      >
        <span aria-hidden="true" className="size-2 rounded-full bg-accent transition-colors duration-200 group-hover/launch:bg-accent-foreground" />
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
