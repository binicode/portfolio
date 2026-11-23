'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteInquiry, setInquiryRead } from '@/lib/admin-client';
import { ApiError } from '@/lib/api-client';
import Button from '@/components/ui/Button';

interface InquiryActionsProps {
  id: string;
  name: string;
  read: boolean;
}

/** Mark read/unread and delete. The server enforces admin access; refresh updates the list and nav count. */
export default function InquiryActions({ id, name, read }: InquiryActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<'read' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: 'read' | 'delete', action: () => Promise<unknown>, failure: string) {
    setBusy(kind);
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : failure);
    } finally {
      setBusy(null);
    }
  }

  function remove() {
    if (!window.confirm(`Delete the inquiry from ${name}? This cannot be undone.`)) return;
    void run('delete', () => deleteInquiry(id), 'Couldn’t delete it. Try again.');
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          isLoading={busy === 'read'}
          disabled={busy !== null}
          onClick={() => void run('read', () => setInquiryRead(id, !read), 'Couldn’t update it. Try again.')}
        >
          {read ? 'Mark unread' : 'Mark read'}
        </Button>
        <Button variant="danger" size="sm" isLoading={busy === 'delete'} disabled={busy !== null} loadingText="Deleting…" onClick={remove}>
          Delete
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
