'use client';

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { OPEN_CHAT_EVENT } from './chat-events';

// The panel (and the chat client it imports) is fetched only when a
// visitor shows intent: hover, focus or click on the launcher.
const loadPanel = () => import('./ChatPanel');
const ChatPanel = lazy(loadPanel);

export default function ChatLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);

  const open = useCallback(() => {
    setHasOpened(true);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    launcherRef.current?.focus();
  }, []);

  useEffect(() => {
    window.addEventListener(OPEN_CHAT_EVENT, open);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, open);
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
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 inline-flex h-11 items-center gap-2.5 rounded-full bg-[var(--cyanotype)] pl-3.5 pr-4 text-sm font-medium text-white shadow-[0_10px_30px_-12px_rgb(15_34_51/0.6)] ring-1 ring-white/20 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 sm:right-6"
      >
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-white" />
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
          <ChatPanel isOpen={isOpen} onClose={close} />
        </Suspense>
      )}
    </>
  );
}
