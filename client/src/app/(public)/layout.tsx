import type { ReactNode } from 'react';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';
import ChatLauncher from '@/components/chat/ChatLauncher';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-frame flex min-h-dvh flex-col">
      <SiteHeader />
      {/* Soft Sand for the reading sections; the teal sections inside keep their teal. */}
      <main id="main" className="theme-sand flex-1">
        {children}
      </main>
      <SiteFooter />
      <ChatLauncher />
    </div>
  );
}
