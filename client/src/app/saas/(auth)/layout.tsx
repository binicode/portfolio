import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import AuthShell from '@/components/site/AuthShell';

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

const POINTS = [
  'GitHub stars and followers',
  'YouTube subscribers and views',
  'Hacker News mentions',
];

export default function SaasAuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthShell
      backHref="/saas"
      backLabel="Product overview"
      aside={
        <>
          <p className="label text-accent">Creator Dashboard</p>
          <div>
            <p className="max-w-[16ch] text-h2 font-medium">Your reach, in one dashboard.</p>
            <ul className="mt-10 space-y-3 border-t border-border pt-8 text-body-sm text-muted-foreground">
              {POINTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </>
      }
    >
      {children}
    </AuthShell>
  );
}
