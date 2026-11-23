# Rebuild Phase 4: complete the MVP (record)

- **Branch:** `rebuild/phase-4-mvp` (from `rebuild/phase-3-plan`)
- **Plan:** `docs/rebuild/phase-3-plan.md`, section 4
- **Status:** in progress; steps 4.1 and 4.2 done

## Progress

| Step | Status | Verified by |
| --- | --- | --- |
| 4.1.1 Merge PR #19 (enquiries) | Done | Lint, types, unit tests, builds |
| 4.1.2 Advisories inside current majors | Done | `npm audit`: client 0; server only Zod (fixed in 4.2) |
| 4.1.3 Remove the shop | Done | All checks; e2e 54 passed, 10 skipped by design |
| 4.1.4 Dead code, README collection name | Done | All checks |
| 4.2.1 Database-backed API tests | Done | In `npm test`; CI caches the MongoDB binary |
| 4.2.2 Express 5, `asyncHandler` dropped | Done | Full suite, including errors thrown in async handlers |
| 4.2.2 Mongoose 9 | Done | Full suite; no deprecation warnings |
| 4.2.2 Zod 4 | Done | Full suite; server `npm audit` 0 |
| 4.2.2 Stripe 23, API version pinned | Done | Full suite; a test ties the pin to the SDK |
| 4.2.2 @google/genai 3, client only with a key | Done | Full suite; no-key chat test |
| 4.2.2 TypeScript 6.0 (both packages) | Done | All checks in both packages |
| 4.2.2 `dotenv` replaced by Node's `--env-file-if-exists` | Done | tsx, tsx watch, node and `npm start` checked |
| Install-script policy | Done | Clean installs, all checks |
| CI dependency audit (high and above) | Done | Both packages at 0 |

## Tests now

- **Server:** 90 tests, 21 of them against a real MongoDB: sign-up and log-in, sessions, the admin and customer separation, the subscription gate, settings, the CMS draft-and-publish flow, http(s)-only project links, project briefs (store, list, mark read, delete, honeypot), the assistant without a model key, and the API running without Stripe.
- **Client:** 38 unit tests; e2e 54 passed, 10 skipped by design (each skipped test belongs to the other viewport).

## Findings made during Phase 4

1. **The API could not start without Stripe configured.** `stripe.service.ts` created the client at import with an empty key, and the SDK (22 and 23) throws on that, so every start without `STRIPE_SECRET_KEY` crashed, although the README called billing optional. Fixed: the client is created on first use, only with a key; billing answers 503 without one.
2. **The Stripe API-version comment was wrong.** It said the account's default version applies; the SDK sends its own. The version is now pinned in code (`2026-11-18.endive`).
3. **A customer's cookie gets 401, not 403, on admin routes.** Admin routes read only the admin cookie, so a customer session there is simply no admin session. Correct; noted because the earlier tests only covered a customer token placed in the admin cookie (403).
4. **npm 11 blocks dependency install scripts by default.** Each package that has one is now explicitly denied; none is needed.
5. **The audit's count of empty server files was 14; it was 11.** Corrected in the audit and the plan.

## Needs the user

- **Hosting choice** (plan section 3): needed by step 4.6.
- **Where biniyam.com's DNS is managed:** needed by step 4.4 (email sending domain).
- **Dependabot alerts:** GitHub repository Settings > Security > enable Dependabot alerts. This session cannot change repository settings.
