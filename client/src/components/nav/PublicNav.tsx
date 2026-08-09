'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Home', matchPrefix: '/' },
  { href: '/projects', label: 'Projects', matchPrefix: '/projects' },
  { href: '/shop', label: 'Shop', matchPrefix: '/shop' },
  { href: '/saas/signup', label: 'SaaS Demo', matchPrefix: '/saas' },
];

export default function PublicNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-6 text-sm">
      {LINKS.map((link) => {
        const isActive = link.matchPrefix === '/' ? pathname === '/' : pathname.startsWith(link.matchPrefix);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              isActive ? 'font-bold text-primary' : 'text-muted transition-colors duration-200 hover:text-foreground'
            }
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
