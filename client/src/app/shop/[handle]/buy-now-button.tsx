'use client';

import { useState } from 'react';
import { createCartCheckoutUrl } from '@/lib/shopify-cart';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface BuyNowButtonProps {
  variantId: string;
  available: boolean;
}

export default function BuyNowButton({ variantId, available }: BuyNowButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setError(null);
    setIsLoading(true);

    try {
      const checkoutUrl = await createCartCheckoutUrl(variantId);
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }

  if (!available) {
    return <p className="text-sm text-muted">Sold out.</p>;
  }

  return (
    <div>
      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      <Button onClick={handleClick} isLoading={isLoading} loadingText="Redirecting…">
        Buy Now
      </Button>
    </div>
  );
}
