import type { ReactNode } from 'react';
import Link from 'next/link';

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/shop" className="font-semibold">
            Shop
          </Link>
          <Link href="/" className="text-sm hover:underline">
            Back to portfolio
          </Link>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
