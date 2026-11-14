import StatusMessage from '@/components/site/StatusMessage';
import ButtonLink from '@/components/ui/ButtonLink';

export default function ShopNotFound() {
  return (
    <StatusMessage
      code="404"
      title="This product isn’t available."
      actions={<ButtonLink href="/shop">Browse the shop</ButtonLink>}
    >
      <p>It may have sold out.</p>
    </StatusMessage>
  );
}
