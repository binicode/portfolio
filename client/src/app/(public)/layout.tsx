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
            <Link href="/saas/signup">SaaS Demo</Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6 text-sm text-gray-500">
          <p>
            {/* REPLACE WITH YOUR OWN FOOTER TEXT / SOCIAL LINKS */}
            © {new Date().getFullYear()} Biniyam Abera. All rights reserved.
          </p>
          <Link href="/login" className="text-xs text-gray-400 hover:text-gray-600">
            Admin
          </Link>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}