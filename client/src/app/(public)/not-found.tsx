import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-4 text-gray-600">
        The page you&apos;re looking for doesn&apos;t exist or isn&apos;t published yet.
      </p>
      <Link href="/" className="mt-6 inline-block text-sm font-medium underline">
        Back to home
      </Link>
    </section>
  );
}