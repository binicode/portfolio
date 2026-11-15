'use client';

import type { ReactNode } from 'react';
import { requestOpenChat, type AssistantMode } from './chat-events';

interface OpenChatButtonProps {
  className?: string;
  /** Opens the assistant in this mode; without it, the panel keeps its current one. */
  mode?: AssistantMode;
  /** Discovery: the project type to preselect (see chat-events). */
  build?: string;
  /** Chat: a question to place in the message box (see chat-events). */
  question?: string;
  /**
   * A second, pointer-only way in (a large preview to click), next to a
   * labelled button: hidden from assistive tech and out of the tab order.
   */
  pointerOnly?: boolean;
  children: ReactNode;
}

/**
 * Opens the assistant panel (a non-modal dialog) from anywhere on the page.
 * Styling comes from the caller, usually `pillClasses` or `link`.
 */
export default function OpenChatButton({ className = '', mode, build, question, pointerOnly = false, children }: OpenChatButtonProps) {
  return (
    <button
      type="button"
      aria-haspopup={pointerOnly ? undefined : 'dialog'}
      aria-hidden={pointerOnly || undefined}
      tabIndex={pointerOnly ? -1 : undefined}
      onClick={() => requestOpenChat(mode, { build, question })}
      className={className}
    >
      {children}
    </button>
  );
}
