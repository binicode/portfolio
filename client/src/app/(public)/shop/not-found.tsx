import type { Metadata } from 'next';
import StatusMessage from '@/components/site/StatusMessage';
import ButtonLink from '@/components/ui/ButtonLink';

export const metadata: Metadata = {
  title: 'Product not found',
  robots: { index: false },
};

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
