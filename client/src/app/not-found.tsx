import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';
import StatusMessage from '@/components/site/StatusMessage';
import ButtonLink from '@/components/ui/ButtonLink';

/** Unmatched URLs anywhere in the app. */
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
          <p>Check the address for a typo, or start from one of these pages.</p>
        </StatusMessage>
      </main>
      <SiteFooter />
    </div>
  );
}
