import type { StaticImageData } from 'next/image';
import dashboardDesktop from '@/assets/previews/dashboard-desktop.webp';
import dashboardMobile from '@/assets/previews/dashboard-mobile.webp';
import storefrontDesktop from '@/assets/previews/storefront-desktop.webp';
import storefrontMobile from '@/assets/previews/storefront-mobile.webp';
import assistantDesktop from '@/assets/previews/assistant-desktop.webp';
import assistantMobile from '@/assets/previews/assistant-mobile.webp';

/**
 * A screenshot of the real site, for a plate's window: the desktop layout
 * (1440 px wide, captured at 2x) and the phone layout (390 px wide, the top
 * 4:5 of the screen, at 3x). Retake them after a visible change to the
 * product: see client/DESIGN-SYSTEM.md, "Plates".
 */
export type Preview = {
  desktop: StaticImageData;
  mobile: StaticImageData;
  alt: string;
};

/**
 * The three products that run on this site, in the order the home page
 * shows them, flagship first. Shown as plates on the home page, and on the
 * work page while the CMS has no published case studies.
 */
export type LiveSystem = {
  /** The plate's id (anchor) and its poster-size title. */
  id: string;
  title: string;
  name: string;
  body: string;
  action: { kind: 'chat'; label: string } | { kind: 'link'; label: string; href: string };
  /** What it runs on, for its architecture map (`StackMap`). */
  stack: string[];
  preview: Preview;
  /** Finds this product's case study in the CMS by its title or slug. */
  caseStudy: RegExp;
};

export const LIVE_SYSTEMS: LiveSystem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    name: 'Creator Dashboard',
    body: 'A paid SaaS: GitHub, YouTube and Hacker News numbers in one dashboard, with Stripe billing.',
    action: { kind: 'link', label: 'Explore the dashboard', href: '/saas' },
    stack: ['Next.js', 'Express', 'MongoDB', 'Stripe', 'TypeScript'],
    preview: {
      desktop: dashboardDesktop,
      mobile: dashboardMobile,
      alt: 'The Creator Dashboard landing page: the headline “Your reach, in one place.”, buttons to create an account or log in, and the dashboard below with sample GitHub, YouTube and Hacker News numbers.',
    },
    caseStudy: /saas|creator|dashboard/i,
  },
  {
    id: 'storefront',
    title: 'Storefront',
    name: 'Headless storefront',
    body: 'Shopify products rendered on the server, with Shopify’s own checkout.',
    action: { kind: 'link', label: 'Browse the store', href: '/shop' },
    stack: ['Next.js', 'Shopify Storefront API', 'TypeScript'],
    preview: {
      desktop: storefrontDesktop,
      mobile: storefrontMobile,
      alt: 'The shop: a grid of snowboards and other products from the Shopify store, each with its photo, name and price.',
    },
    caseStudy: /shopify|storefront|shop/i,
  },
  {
    id: 'assistant',
    title: 'Assistant',
    name: 'Portfolio assistant',
    body: 'Ask about my work and get answers from my notes, streamed, with sources. It can also plan your project.',
    action: { kind: 'chat', label: 'Try the assistant' },
    stack: ['Next.js', 'Express', 'SSE', 'MongoDB Atlas Vector Search', 'Voyage AI', 'Gemini', 'TypeScript'],
    preview: {
      desktop: assistantDesktop,
      mobile: assistantMobile,
      alt: 'The assistant open on this site: a panel with suggested questions about my projects, stack and background, and a box to ask your own.',
    },
    caseStudy: /assistant|rag|chat/i,
  },
];

/** The screenshot for a CMS case study, when it is one of the live products. */
export function previewForProject(project: { title: string; slug: string }): Preview | null {
  const system = LIVE_SYSTEMS.find((s) => s.caseStudy.test(`${project.title} ${project.slug}`));
  return system?.preview ?? null;
}
