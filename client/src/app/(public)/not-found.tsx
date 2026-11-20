import type { Metadata } from 'next';
import StatusMessage from '@/components/site/StatusMessage';
import ButtonLink from '@/components/ui/ButtonLink';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
};

export default function NotFound() {
  return (
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
      <p>It may have moved. Try one of these.</p>
    </StatusMessage>
  );
}
