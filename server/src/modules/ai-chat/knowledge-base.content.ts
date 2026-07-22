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
    sourceTitle: 'About Me',
    sourceType: 'bio',
    content:
      `BACKGROUND & ROLE
I am Biniyam Abera, a Full-Stack Software Engineer based in Addis Ababa, Ethiopia (UTC+3). I have a background in Civil Engineering, transitioning into modern web development. My engineering foundation gives me a strong structural mindset, attention to detail, and a analytical approach to problem-solving. I specialize in building web applications with TypeScript, Node.js, Express, React, and MongoDB, focusing on backend architecture, clean API design, and AI features like Retrieval-Augmented Generation (RAG).

CURRENT FOCUS & FREELANCING
I am currently focusing on freelance software engineering, delivering tailored web solutions, API integrations, and custom applications for clients. I bring an engineering-grade rigor to every freelance project, ensuring maintainability, performance, and clean code.

TECHNICAL SKILLS & STACK
- Frontend: React, Next.js, TypeScript, Tailwind CSS, HTML5/CSS3.
- Backend: Node.js, Express, TypeScript, REST APIs, GraphQL, Microservices architecture.
- Databases: MongoDB, MongoDB Atlas Vector Search, PostgreSQL, Redis.
- DevOps & Tools: Git, GitHub, Docker, CI/CD, AWS, Vercel.
- AI & LLMs: Anthropic Claude API, OpenAI API, Voyage AI Embeddings, RAG implementations, Vector Search.

WHAT I BUILD & WORK ON
I enjoy building end-to-end applications that prioritize performance, type safety, and clean code principles. Recently, I built a full-stack portfolio monorepo featuring custom JWT security, tiered rate-limiting, and an interactive RAG AI assistant powered by Claude and MongoDB Atlas Vector Search.

CAREER GOALS & WORK PREFERENCES
I am open to freelance client engagements, contract work, and full-time opportunities as a Full-Stack or Backend Engineer. I value working on projects that emphasize clean code standards, automated testing, continuous learning, and thoughtful system design.`,
  },
];