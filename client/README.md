# Client

The Next.js site: the portfolio, the Creator Dashboard (`/saas`), the
assistant and the CMS admin. Setup, environment and
deployment are in the [root README](../README.md); the visual language is in
[DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).

```bash
npm ci
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check |
| `npm test` | Unit tests (Node's test runner) |
| `npm run test:e2e` | Playwright: builds the site against a local stand-in for the API, then runs the journeys, axe and screenshots |
| `npm run test:e2e:report` | Opens the last Playwright report |
| `npm run test:qa` | The recorded QA run against the real API and a local MongoDB (`e2e/qa`) |
| `npm run fonts:subset` | Regenerates the self-hosted font subsets |
| `npm run orbit:keyframes` | Regenerates the hero orbit's keyframes |
