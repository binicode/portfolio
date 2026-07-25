import type { ReactNode } from 'react';
import Link from 'next/link';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-semibold text-lg tracking-tight hover:opacity-80 transition">
            Biniyam
          </Link>
          <div className="flex gap-6 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-black transition">
              Home
            </Link>
            <Link href="/projects" className="hover:text-black transition">
              Projects
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Biniyam Abera. All rights reserved.</p>
          <p className="text-xs text-gray-400">
            Built with Next.js, Express, TypeScript, and MongoDB.
          </p>
        </div>
      </footer>

      {/* Chat widget mount point — added here once
          components/chat/ChatWidget.tsx exists, a few steps from now. */}
    </div>
  );
}