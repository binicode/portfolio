import type { Metadata } from 'next';
import SaasLoginForm from './login-form';

export const metadata: Metadata = {
  title: 'Log in to Creator Dashboard',
};

export default function SaasLoginPage() {
  return <SaasLoginForm />;
}
