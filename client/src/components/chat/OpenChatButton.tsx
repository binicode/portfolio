'use client';

import type { ReactNode } from 'react';
import { requestOpenChat } from './chat-events';

interface OpenChatButtonProps {
  className?: string;
  children: ReactNode;
}

export default function OpenChatButton({ className = '', children }: OpenChatButtonProps) {
  return (
    <button type="button" onClick={requestOpenChat} className={className}>
      {children}
    </button>
  );
}
