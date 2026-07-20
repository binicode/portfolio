---
name: Portfolio Blueprint Rules
alwaysApply: true
---
# Portfolio App Rules

- We are writing a decoupled codebase split into `/client` (Next.js) and `/server` (Node/Express/MongoDB).
- Always use modern JavaScript ES Modules (`import/export`) instead of CommonJS (`require`).
- For any Express route files, assume that `app.use(express.json())` and `app.use(cors())` are already running globally.
- Never write placeholder comments like `// implement logic here`. Implement completely or wrap securely with explicit error handling.