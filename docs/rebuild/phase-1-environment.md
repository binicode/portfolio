# Rebuild Phase 1: Claude Code environment setup

- **Date:** 2026-11-22
- **Branch:** `rebuild/phase-1-environment`
- **Starting point:** `main` at `d09ea37` (#18, "Polish the site and prepare it for release")
- **Code changed:** none. This phase changed only project instructions, Claude settings and the cloud environment.

## What is set up

| Area | Decision | Reason |
| --- | --- | --- |
| Project instructions | `CLAUDE.md` gained the user's non-negotiables (section 1), the five rebuild phases (section 11), environment and check commands (14), skills and tools (15) and the Git workflow (16). Everything else in it is kept. | One source of truth that every session loads. |
| Claude settings | `.claude/settings.json` denies reading or editing real `.env` files and allows the routine checks CI runs. | Secrets stay out of reach. Deny rules are evaluated before allow rules, so nothing can reopen them. |
| Cloud environment | Personal `portfolio` environment: package registries, the official docs for this stack, and `cdn.playwright.dev`. Its setup script makes Node 24 the default, runs `npm ci` in both packages and installs the Playwright browser the client pins. The Default environment is unchanged. | Docs and the e2e browser download were blocked. Fresh sessions start ready to verify. |
| Skills | Built in: `security-review`, `code-review`, `simplify`, `run`, `frontend-design`. Project: `ui-ux-pro-max`, scoped to accessibility and UX checks. | They cover review, security, browser checks and design without duplicating each other. |
| Plugins | None added. | Playwright MCP duplicates the project's own Playwright. The community dev kits duplicate built-in skills and add broad hooks. Stripe's official plugin waits until Phase 3 decides whether billing stays. |
| Connectors | None needed. | The account's mail, docs and data connectors are unrelated to this project. |

## Baseline of `main`

Node 24.22.3, npm 11.19.1, with CI's placeholder public values for the client.

| Check | server | client |
| --- | --- | --- |
| `npm ci` | pass | pass |
| `npm run lint` | pass | pass |
| `npx tsc --noEmit` | pass | pass |
| `npm test` | 54 / 54 | 37 / 37 |
| `npm run build` | pass | pass (1) |
| `npm run test:e2e` | n/a | pending (run in progress) |
| `npm audit --omit=dev` | 6: 2 critical, 3 high, 1 moderate | 2 high |

(1) With no Shopify store configured, the product fetch fails at build time and `/shop` renders its empty state. That is the intended CI behaviour.

### Dependency advisories (production dependencies)

- **server**
  - `mongoose` 8.x (critical): `sanitizeFilter` not applied at connection level or on `countDocuments`; prototype pollution.
  - `proxy-addr` ≤ 2.0.7 (critical): IP spoofing through an IPv4-mapped IPv6 trust subnet. This matters because rate limits rely on `TRUST_PROXY`.
  - `body-parser` < 1.20.9 (high): denial of service.
  - `ip-address` ≤ 10.7.3 (high): SSRF and trust-boundary bypasses.
  - `zod` < 4.6.6 (high): memory exhaustion. The fix is the major upgrade to Zod 4.
  - `qs` (moderate): denial of service.
- **client**
  - `nanoid` < 3.3.18 (high).
  - `source-map-js` ≤ 1.2.1 (high).

Nothing is fixed in Phase 1, because no code changes before the audit. Most advisories have non-breaking fixes. Their order is set in Phase 3 and the fixes are made early in Phase 4.

## Findings carried into Phase 2

1. **Advisories above.** Security priority.
2. **Major versions behind the latest release** (npm registry, 2026-11-22): express 4 → 5.3, mongoose 8 → 9, stripe 22 → 23, zod 3 → 4, @google/genai 2 → 3, @shopify/storefront-api-client 1 → 2, typescript 5 → 7, eslint 9 → 10, dotenv 16 → 18. Next.js (16.4.6) is current. Node 26 is now the active LTS; the project uses 24. Each upgrade needs its official migration guide checked before a decision.
3. **Install scripts:** npm 11 warns that `unrs-resolver`'s install script is not covered by an `allowScripts` policy. An explicit install-script policy would harden the supply chain.
4. **CI** has no dependency audit step and no automated dependency updates.
5. **Continue rules:** `.continue/rules/portfolio-conventions.md` (rules for the Continue assistant) says `cors()` runs open and global. The server actually uses an origin allowlist with credentials (`server/src/core/app.ts`). Verify every rule there in Phase 2, then correct or remove the file with the user.
6. **Open work outside `main`:** PR #19 (`feature/send-brief`), PR #12 (`feature/editorial-showcase`) and 16 other remote branches. Phase 3 decides whether each is merged, folded into the rebuild or closed.
7. **`Claude outputs/ui-ux-pro-max.zip`:** a byte-identical copy of `.claude/skills/ui-ux-pro-max/` (577 KB, binary). Awaiting the user's decision.

## Re-running the baseline

```bash
cd server && npm ci && npm run lint && npx tsc --noEmit && npm test && npm run build && npm audit --omit=dev
```

```bash
cd client && npm ci && npm run lint && npx tsc --noEmit && npm test && npm run build && npm run test:e2e && npm audit --omit=dev
```

Without `client/.env.local`, export the placeholder values from `.github/workflows/ci.yml` first.
