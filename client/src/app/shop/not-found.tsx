import Link from 'next/link';

export default function ShopNotFound() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-2xl font-bold">Product not found</h1>
      <p className="mt-4 text-gray-600">This product doesn&apos;t exist or is no longer available.</p>
      <Link href="/shop" className="mt-6 inline-block text-sm font-medium underline">
        Back to shop
      </Link>
    </section>
  );
}
