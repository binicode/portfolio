import StatusMessage from '@/components/site/StatusMessage';
import ButtonLink from '@/components/ui/ButtonLink';

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
      <p>It may have been moved or unpublished. Check the address, or start from one of these pages.</p>
    </StatusMessage>
  );
}
