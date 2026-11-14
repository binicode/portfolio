'use client';

import type { ReactNode } from 'react';
import { requestOpenChat, type AssistantMode } from './chat-events';

interface OpenChatButtonProps {
  className?: string;
  /** Opens the assistant in this mode; without it, the panel keeps its current one. */
  mode?: AssistantMode;
  children: ReactNode;
}

export default function OpenChatButton({ className = '', mode, children }: OpenChatButtonProps) {
  return (
    <button type="button" onClick={() => requestOpenChat(mode)} className={className}>
      {children}
    </button>
  );
}
