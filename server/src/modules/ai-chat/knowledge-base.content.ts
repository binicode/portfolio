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
];