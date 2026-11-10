import type { Metadata } from 'next';
import SaasSignupForm from './signup-form';

export const metadata: Metadata = {
  title: 'Create a Creator Dashboard account',
};

export default function SaasSignupPage() {
  return <SaasSignupForm />;
}
