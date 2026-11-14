import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';
import StatusMessage from '@/components/site/StatusMessage';
import ButtonLink from '@/components/ui/ButtonLink';
import ChatLauncher from '@/components/chat/ChatLauncher';

/**
 * Unmatched URLs anywhere in the app. Mounts the assistant like the public
 * layout, so the header's and footer's "Start a project" work here too.
 */
export default function RootNotFound() {
  return (
    <div className="site-frame flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        <StatusMessage
          code="404"
          title="This page doesn’t exist."
          actions={
            <>
              <ButtonLink href="/">Go to the home page</ButtonLink>
              <ButtonLink href="/projects" variant="secondary">
                See my work
              </ButtonLink>
            </>
          }
        >
          <p>Check the address, or start here.</p>
        </StatusMessage>
      </main>
      <SiteFooter />
      <ChatLauncher />
    </div>
  );
}
