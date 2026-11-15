import type { KnowledgeSourceType } from './ai-chat.types.js';

export interface KnowledgeSourceEntry {
  sourceId: string;
  sourceTitle: string;
  sourceType: KnowledgeSourceType;
  content: string;
}

/**
 * Raw source content for the RAG knowledge base. Each entry is chunked
 * and embedded by scripts/seed-knowledge-base.ts.
 */
export const knowledgeBaseSources: KnowledgeSourceEntry[] = [
  {
    sourceId: 'bio-main',
    sourceTitle: 'About Me & Professional Background',
    sourceType: 'bio',
    content: `BACKGROUND & ROLE
I am Biniyam (Bini) Abera, a Full-Stack Software Engineer based in Addis Ababa, Ethiopia (UTC+3). I hold a Bachelor of Science (B.Sc.) degree in Civil Engineering and transitioned into modern web application development. My engineering background gives me a structural mindset, precision, and a disciplined approach to software system architecture.

I specialize in building end-to-end, type-safe web applications using TypeScript, Node.js, Express, Next.js, and MongoDB. I focus on resilient backend architectures, clean REST/GraphQL API design, and AI integrations like Retrieval-Augmented Generation (RAG) and Server-Sent Events (SSE) streaming.

CURRENT FOCUS & FREELANCING
I work as a freelance software engineer, delivering custom web applications, API integrations, and AI-enabled systems for clients. I bring engineering-grade rigor to every project, prioritizing performance, clean code, security, and long-term maintainability.

CAREER GOALS & WORK PREFERENCES
I am open to freelance client engagements, contract projects, and full-time software engineering roles (Full-Stack or Backend). I value teams and projects that emphasize clean code standards, continuous learning, and thoughtful system architecture.`,
  },
  {
    sourceId: 'certifications',
    sourceTitle: 'Professional Certifications',
    sourceType: 'credentials',
    content: `CERTIFICATIONS & CREDENTIALS
- Meta Front-End Developer Professional Certificate: Specialized in React, modern JavaScript/TypeScript, UI component architectures, responsive web design, and front-end performance.
- IBM JavaScript Back-End Developer Professional Certificate: Specialized in Node.js, Express, microservices architecture, server-side asynchronous programming, RESTful API development, and security best practices.`,
  },
  {
    sourceId: 'personal-trivia',
    sourceTitle: 'Personal Life & Interests',
    sourceType: 'personal',
    content: `PERSONAL LIFE & INTERESTS
- Family: I am a proud father of 3 children.
- Hobbies: Outside of coding and software design, I love playing the guitar.
- Favorite Media: My favorite movies and television series include classic masterpieces like "The Godfather" and "Breaking Bad".`,
  },
  {
    sourceId: 'technical-stack',
    sourceTitle: 'Technical Skills & Architecture Stack',
    sourceType: 'skills',
    content: `TECHNICAL SKILLS & TOOLING
- Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS, HTML5/CSS3.
- Backend: Node.js, Express, TypeScript, REST APIs, GraphQL, Microservices, JWT Auth, SSE Streaming.
- Databases & Search: MongoDB, MongoDB Atlas Vector Search, PostgreSQL, Redis.
- AI & LLMs: Gemini API (Google Generative AI), Vector Embeddings, RAG Architectures, Real-Time Streaming Chat Assistants.
- DevOps & Tools: Git, GitHub, Docker, CI/CD pipelines, AWS, Vercel.

PROJECT HIGHLIGHTS
I designed and built a full-stack portfolio monorepo featuring custom JWT authentication, rate-limiting, an Express SSE streaming server, and an interactive RAG AI assistant integrated with Gemini API and MongoDB Atlas Vector Search.`,
  },
  // The entries below describe what is live on this site, in the site's own
  // words (the /saas and /shop pages, the assistant). Facts only: no prices,
  // client names or numbers that the site doesn't state.
  {
    sourceId: 'services',
    sourceTitle: 'Services & How to Work With Me',
    sourceType: 'bio',
    content: `SERVICES
I design and build web applications and SaaS products end to end: the interface, the API and the database. Typical work:
- Web apps and SaaS products with Next.js, TypeScript, Node.js, Express and MongoDB, including accounts, authentication and subscription billing with Stripe.
- APIs and integrations with third-party services (payments, e-commerce, data providers).
- AI features: assistants that answer from a knowledge base (retrieval-augmented generation), streamed responses, embeddings and vector search.
- E-commerce: headless storefronts on Shopify, rendered on the server and using Shopify's own checkout.

HOW TO START A PROJECT
The quickest start is the "Plan a project" mode of this assistant: a few multiple-choice questions, about 2 minutes, and it writes a project brief you can copy and send me. You can also message me on LinkedIn.
Prices and timelines are not published on the site. They depend on the scope, and the project brief is the starting point for an estimate.

AVAILABILITY
I take freelance client projects and contract work, and I am open to full-time Full-Stack or Backend roles.`,
  },
  {
    sourceId: 'project-creator-dashboard',
    sourceTitle: 'Creator Dashboard (SaaS)',
    sourceType: 'project',
    content: `CREATOR DASHBOARD: A WORKING SUBSCRIPTION SAAS (live on this site at /saas)
A paid SaaS with Stripe billing that puts a creator's reach in one dashboard: GitHub stars and followers, YouTube subscribers and views, and Hacker News mentions, side by side.
How it works: sign up with email and password, subscribe through Stripe Checkout, connect GitHub, YouTube and Hacker News, then read your numbers. Signing up is free; the dashboard needs a subscription, and the price shows at checkout.
How it is built: Next.js, Express, MongoDB, Stripe and TypeScript.
- Verified payments: every Stripe webhook is signature-checked.
- Server-side access: the API checks the subscription on every request, not just the interface.
- Contained failures: if one data provider is down, the rest of the dashboard keeps working.
- Sessions in httpOnly, SameSite=Strict, Secure cookies, out of reach of scripts.`,
  },
  {
    sourceId: 'project-storefront',
    sourceTitle: 'Headless Shopify Storefront',
    sourceType: 'project',
    content: `HEADLESS SHOPIFY STOREFRONT (live on this site at /shop)
A storefront that reads products live from Shopify through the Shopify Storefront API and renders them on the server with Next.js, for fast pages and search-friendly HTML. Purchases go through Shopify's own checkout ("Buy now" and the cart hand over to Shopify).
Built with Next.js, the Shopify Storefront API and TypeScript.`,
  },
  {
    sourceId: 'project-assistant',
    sourceTitle: 'Portfolio AI Assistant',
    sourceType: 'project',
    content: `THE PORTFOLIO AI ASSISTANT (this assistant)
It answers questions about my work from a curated knowledge base, with the sources it used. It is a retrieval-augmented generation (RAG) system: questions are embedded with Voyage AI, matched against my notes with MongoDB Atlas Vector Search, and answered by Google Gemini, streamed to the browser over Server-Sent Events from an Express API.
It has a second mode, "Plan a project", a short questionnaire that ends in a written project brief.
Built with Next.js, Express, MongoDB Atlas Vector Search, Voyage AI, Gemini, SSE and TypeScript.`,
  },
  {
    sourceId: 'project-portfolio-site',
    sourceTitle: 'This Portfolio Site',
    sourceType: 'project',
    content: `THIS PORTFOLIO SITE
A full-stack monorepo: a Next.js (App Router) front end rendered on the server, and an Express API with MongoDB. It includes a private admin CMS (only I can log in to it; visitors can't try it) where I draft and publish the case studies shown on the Work page, plus the Creator Dashboard SaaS, the Shopify storefront and this assistant, which visitors can try. Rate limiting, input validation and server-side authorization protect the API.`,
  },
];