import type { Metadata } from 'next';
import AuthShell from '@/components/site/AuthShell';
import AdminLoginForm from './admin-login-form';

export const metadata: Metadata = {
  title: 'Admin sign in',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <AuthShell backHref="/" backLabel="Back to the site">
      <AdminLoginForm />
    </AuthShell>
  );
}
