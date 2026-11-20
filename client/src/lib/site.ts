/**
 * Site-wide identity and navigation. Plain data, safe to import from
 * Server and Client Components alike.
 */

export const site = {
  name: 'Biniyam Abera',
  role: 'Freelance full-stack engineer',
  description:
    'Freelance full-stack engineer building SaaS, AI features and online stores with Next.js, Node.js and MongoDB. Try three live products, then plan yours.',
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

/** The one line under every call to action that opens the planner. */
export const PLANNER_NOTE = 'Free. 2 minutes. You keep the brief.';
