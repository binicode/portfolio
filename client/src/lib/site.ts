/**
 * Site-wide identity and navigation. Plain data, safe to import from
 * Server and Client Components alike.
 */

export const site = {
  name: 'Biniyam Abera',
  role: 'Full-stack software engineer',
  description:
    'Biniyam Abera is a full-stack software engineer with a background in civil engineering, building web applications and SaaS products with Next.js, TypeScript, Node.js, Express and MongoDB.',
  githubUsername: 'binicode',
} as const;

export const socials = [
  { label: 'LinkedIn', href: 'https://linkedin.com/in/biniyam-abera-a7bbb8410' },
  { label: 'GitHub', href: 'https://github.com/binicode' },
] as const;

export const primaryNav = [
  { label: 'Work', href: '/projects' },
  { label: 'SaaS', href: '/saas' },
  { label: 'Shop', href: '/shop' },
  { label: 'About', href: '/#about' },
] as const;

export const contactHref = socials[0].href;
