import type { ReactNode } from 'react';
import Link from 'next/link';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-semibold">
            {/* REPLACE WITH YOUR NAME/LOGO */}
            Your Name
          </Link>
          <div className="flex gap-6 text-sm">
            <Link href="/">Home</Link>
            <Link href="/projects">Projects</Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t">
        <div className="mx-auto max-w-4xl px-6 py-6 text-sm text-gray-500">
          {/* REPLACE WITH YOUR OWN FOOTER TEXT / SOCIAL LINKS */}
          © {new Date().getFullYear()} Your Name. All rights reserved.
        </div>
      </footer>

      {/* Chat widget mount point — added here once
          components/chat/ChatWidget.tsx exists, a few steps from now. */}
    </div>
  );
}