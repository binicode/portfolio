import type { ReactNode } from 'react';
import Link from 'next/link';
import ChatWidget from '@/components/chat/ChatWidget';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-semibold">
            Biniyam
          </Link>
          <div className="flex gap-6 text-sm">
            <Link href="/">Home</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/shop">Shop</Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t">
        <div className="mx-auto max-w-4xl px-6 py-6 text-sm text-gray-500">
          © {new Date().getFullYear()} Biniyam Abera. All rights reserved.
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
