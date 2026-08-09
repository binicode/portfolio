import type { ReactNode } from 'react';
import Link from 'next/link';
import ChatWidget from '@/components/chat/ChatWidget';
import PublicNav from '@/components/nav/PublicNav';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/10">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-bold">
            Biniyam Abera
          </Link>
          <PublicNav />
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6 text-sm text-muted">
          <p>
            © {new Date().getFullYear()} Biniyam Abera. All rights reserved.
          </p>
          <Link href="/login" className="text-xs text-muted/60 hover:text-muted">
            Admin
          </Link>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
