# Rebuild Phase 4: complete the MVP (record)

- **Branch:** `rebuild/phase-4-mvp` (from `rebuild/phase-3-plan`)
- **Plan:** `docs/rebuild/phase-3-plan.md`, section 4
- **Status:** in progress; steps 4.1 to 4.3 done (4.3.4's sign-up half waits for 4.4)

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
| 4.3.1 `JWT_SECRET` required; HS256 only | Done | Unit tests: other algorithms, unsigned tokens, other secrets refused |
| 4.3.2 Audiences per sign-in context | Done | Unit and database tests; QA boundary suite run against a local MongoDB |
| 4.3.3 Revocable sessions (token version) | Done | Database tests: signing out revokes copied tokens, customer and admin |
| 4.3.4 Log-in: one bcrypt comparison whatever the email | Done | Database tests: unknown email and wrong password answer identically |
| 4.3.4 Sign-up answers the same for new and taken addresses | With 4.4 | Needs email verification |

## Tests now

- **Server:** 106 tests, 27 of them against a real MongoDB: sign-up and log-in, sessions and their revocation, equal refusals for unknown emails, the sign-in rate limit, the admin and customer separation, the subscription gate, settings, the CMS draft-and-publish flow, http(s)-only project links, project briefs (store, list, mark read, delete, honeypot), the assistant without a model key, and the API running without Stripe.
- **Client:** 38 unit tests; e2e 54 passed, 10 skipped by design (each skipped test belongs to the other viewport).
- **QA suite** (manual, `npm run test:qa`): its API-boundary file was run for 4.3 against a throwaway local MongoDB without provider keys: 8 passed; the Stripe webhook check answered 503 instead of 400, as designed when no Stripe key is set (that suite expects the keys from `server/.env`).

## Findings made during Phase 4

1. **The API could not start without Stripe configured.** `stripe.service.ts` created the client at import with an empty key, and the SDK (22 and 23) throws on that, so every start without `STRIPE_SECRET_KEY` crashed, although the README called billing optional. Fixed: the client is created on first use, only with a key; billing answers 503 without one.
2. **The Stripe API-version comment was wrong.** It said the account's default version applies; the SDK sends its own. The version is now pinned in code (`2026-11-18.endive`).
3. **A customer's cookie gets 401, not 403, on admin routes.** Admin routes read only the admin cookie, so a customer session there is simply no admin session. Correct; noted because the earlier tests only covered a customer token placed in the admin cookie (403).
4. **npm 11 blocks dependency install scripts by default.** Each package that has one is now explicitly denied; none is needed.
5. **The audit's count of empty server files was 14; it was 11.** Corrected in the audit and the plan.
6. **Changes in behaviour from 4.3**, deliberate:
   - A customer token sent to an admin route (or the reverse) now gets 401, not 403: it is no session of that kind at all.
   - Admin sign-in and `/api/admin/auth/me` need the database (the admin's token version lives there) and answer 503 without it. Logging out always works; without the database it only clears the cookie.
   - Every signed-in request reads the account's token version: one small database read per request.
   - Sign-up, both log-ins and registration share one rate-limit budget per address (unchanged), and the database tests use it exactly; the last test checks the 11th attempt is refused.
7. **Security review of 4.3** (`security-review`): no vulnerability at the reporting bar. Every route guarded before is still guarded; no route still uses the old guards. Acted on one observation below the bar: logging out with an already revoked copy of a token could sign out the sessions that came after it. Logout now revokes only for a current token, and the database tests cover it for both kinds. Left as they are: the rate-limit key does not check the token version (it is not a guard), and registering a taken address answers 409 (fixed with 4.4).
8. **Password changes must bump the token version.** There is no password change yet; the reset flow in 4.4 must call `bumpCustomerTokenVersion`, and a change of `ADMIN_PASSWORD_HASH` should be followed by an admin sign-out, which bumps the admin's version.

## Needs the user

- **Hosting choice** (plan section 3): needed by step 4.6.
- **Where biniyam.com's DNS is managed:** needed by step 4.4 (email sending domain).
- **Dependabot alerts:** GitHub repository Settings > Security > enable Dependabot alerts. This session cannot change repository settings.
