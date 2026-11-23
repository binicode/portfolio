import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Account deleted',
};

/** Where deleting an account lands: the session is gone, so the dashboard can't show this. */
export default function AccountDeletedPage() {
  return (
    <div className="space-y-5" role="status">
      <h1 className="text-h2 font-medium">Your account is deleted</h1>
      <p className="text-muted-foreground">
        Your settings are gone and any subscription was cancelled. Stripe keeps its own record of past payments.
      </p>
      <p className="text-sm text-muted-foreground">
        <Link href="/" className="link font-medium text-foreground">
          Back to the site
        </Link>
      </p>
    </div>
  );
}
