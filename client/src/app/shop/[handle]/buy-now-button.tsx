'use client';

import { useState } from 'react';
import { createCartCheckoutUrl } from '@/lib/shopify-cart';

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
    return <p className="text-sm text-gray-400">Sold out.</p>;
  }

  return (
    <div>
      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="rounded-md bg-black px-6 py-3 text-sm font-medium text-white disabled:opacity-40"
      >
        {isLoading ? 'Redirecting…' : 'Buy Now'}
      </button>
    </div>
  );
}
