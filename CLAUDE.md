# CLAUDE.md --- Project Operating Guide

## 1. Project mission

Build and maintain an exceptional full-stack developer portfolio and
SaaS platform.

The website must combine:

1.  A distinctive, premium visual identity.
2.  Excellent real-world performance, especially on mobile.
3.  Strong technical SEO and search discoverability.
4.  Clear, useful content that demonstrates real engineering ability.
5.  Secure, maintainable SaaS and integration infrastructure.

The goal is not to add features for their own sake. The goal is to
deliver a fast, discoverable, beautiful, secure, and maintainable
product.

### Non-negotiable requirements (set by the user, November 2026)

1.  **Security first.** Consider security in every architectural and
    implementation decision. Use strong, current defaults: validation at
    every boundary, server-side authorization, least privilege, secure
    cookies and headers, dependency hygiene. Review for vulnerabilities
    and fix them before calling anything complete.
2.  **Authentic design, no AI-generated look.** No predictable template
    layouts, filler sections, generic SaaS patterns or decorative excess.
    Every design and implementation decision needs a clear purpose.
    Favour authenticity, consistency, simplicity and craft.
3.  **Current information.** Before a technical decision, check the
    current official documentation, versions, security advisories and
    best practices (section 14 lists the reachable docs). Do not rely on
    memory, deprecated APIs or old tutorials. Check compatibility before
    adding or upgrading a dependency.
4.  **Continuous verification.** Never assume something works because it
    was written. Verify functionality, security, compatibility and
    quality throughout. Correctness and long-term reliability come before
    speed.

Also: do not invent features or sections the user has not asked for, and
do not remove an existing feature without the user's decision.

## 2. Current project status --- source of truth

The project already has a substantial, operational foundation:

-   Next.js 16 client application.
-   Express.js backend.
-   MongoDB Atlas.
-   MongoDB Atlas Vector Search.
-   Google Gemini-powered RAG assistant.
-   Voyage AI embeddings.
-   Stripe subscription billing and webhooks.
-   Headless Shopify integration: removed (the user dropped the shop, November 2026).
-   Client-side application architecture and SaaS/admin interfaces.

The revised direction should be:
1.	Audit the current frontend and identify what is worth keeping.
2.	Rethink the overall visual identity, page layouts, typography, navigation, and user experience.
3.	Establish a new cohesive design system.
4.	Design desktop and mobile experiences intentionally.
5.	Use v0 components as reusable references, not mandatory designs.
6.	Rebuild the homepage and hero around the new direction.
7.	Redesign remaining pages consistently.
8.	Optimize performance throughout implementation.
Architecture preservation does not mean design preservation. Keep the working backend, but give the frontend permission to be substantially redesigned.


Treat these as user-reported facts until verified in the repository. Do
not assume every integration is production-ready merely because it
currently works.

**Rebuild (November 2026).** The user is restarting from this codebase,
in this repository, because the result felt generic and contained
unnecessary parts. Which parts are unnecessary is established with
evidence in the audit and decided by the user; see section 11.

## 3. Highest-level working rule

**Audit first. Decide second. Implement third.**

The user is not yet confident that the current architecture is the right
one. Resolve that concern with evidence before making broad changes.

Do not automatically rebuild the project. Distinguish between:

-   An actual architectural defect.
-   A localized implementation problem.
-   Missing documentation or lack of understanding.
-   A preference for a different pattern that does not justify
    migration.

For each significant finding, classify it:

-   **KEEP** --- sound; leave it alone.
-   **FIX** --- localized defect or missing safeguard.
-   **REFACTOR** --- structure needs improvement without replacing the
    whole system.
-   **REDESIGN** --- fundamental replacement is justified by specific
    evidence.

State the evidence, affected files, risk, and expected benefit. Never
recommend a rewrite merely because a different technology or pattern is
fashionable.

## 4. Model-selection policy

Choose the model and effort according to task complexity. Do not use
Opus Max for routine implementation.

Use Claude Code's `/model` and `/effort` commands to select the model
and effort available in the user's account. Model availability and plan
limits can change; if a model is unavailable, choose the closest
available model with equivalent capability.

  --------------------------------------------------------------------------------
  Work type               Preferred model   Effort            Guidance
  ----------------------- ----------------- ----------------- --------------------
  Initial whole-system    Opus 5.5          High; Max only    Read-only
  architecture audit                        for the hardest   investigation. Use
                                            synthesis         Max only if the
                                                              high-effort audit
                                                              leaves consequential
                                                              ambiguity.

  Decide retain vs        Opus 5.5          Max               High-impact
  refactor vs redesign                                        decision. Cite
                                                              repository evidence
                                                              and explain
                                                              trade-offs.

  Target architecture and Opus 5.5          High / Max        Use Max for final
  architecture diagrams                                       cross-system
                                                              decisions, not
                                                              diagram formatting.

  Authentication and      Opus 5.5          High / Max        Security-critical.
  authorization review                                        Verify server-side
                                                              enforcement and
                                                              trust boundaries.

  Stripe billing and      Opus 5.5          High              Check signatures,
  webhook review                                              idempotency,
                                                              retries, state
                                                              transitions, and
                                                              entitlement
                                                              enforcement.

  RAG architecture and    Opus 5.5          High              Review ingestion,
  access-control review                                       chunking, embedding
                                                              versioning,
                                                              retrieval, tenant
                                                              boundaries, and
                                                              failure handling.

  Shopify integration     Sonnet 5.5        High              Escalate to Opus if
  review                                                      security, data
                                                              consistency, or
                                                              complex architecture
                                                              issues emerge.

  Frontend architecture   Opus 5.5          High              Use for system-level
  and Server/Client                                           decisions; avoid
  Component boundaries                                        repeated
                                                              full-repository
                                                              scans.

  UI migration plan and   Opus 5.5          High              Plan once, then
  design-system decisions                                     implement
                                                              consistently with
                                                              Sonnet.

  v0 component assembly   Sonnet 5.5        Medium / High     Main implementation
  and page implementation                                     model. Follow
                                                              existing approved
                                                              design and
                                                              architecture.

  Hero section refactor   Sonnet 5.5        High              Use Opus only if
  and mobile optimization                                     profiling reveals a
                                                              complex
                                                              architectural
                                                              bottleneck.

  Design-token cleanup    Sonnet 5.5        Medium            Use Haiku 5.5 for
  and CSS/Tailwind work                                       simple, mechanical
                                                              edits if available
                                                              and reliable.

  Missing imports, simple Sonnet 5.5 or     Low / Medium      Keep the task
  TypeScript errors,      Haiku 5.5                           narrowly scoped and
  small fixes                                                 run checks.

  SEO metadata, sitemap,  Sonnet 5.5        Medium / High     Use Opus for a
  robots, canonical tags,                                     site-wide SEO
  JSON-LD                                                     architecture
                                                              decision.

  Core Web Vitals         Sonnet 5.5        High              Use measured
  investigation                                               profiling data.
                                                              Escalate difficult
                                                              cross-layer
                                                              diagnosis to Opus.

  Accessibility and       Sonnet 5.5        Medium / High     Use browser/device
  responsive QA                                               evidence; do not
                                                              claim untested
                                                              compliance.

  Complex production      Opus 5.5          High / Max        First reproduce the
  debugging                                                   issue and collect
                                                              logs, traces, and
                                                              relevant code.

  Final                   Opus 5.5          Max               Review evidence and
  security/architecture                                       tests; do not make
  review before launch                                        unapproved broad
                                                              changes.

  Documentation,          Haiku 5.5 or      Low / Medium      Prefer concise
  summaries, routine test Sonnet 5.5                          output.
  scaffolding                                                 
  --------------------------------------------------------------------------------

### Default model strategy

-   **Default implementation model:** Sonnet 5.5 at Medium effort.
-   **Complex implementation or diagnosis:** Sonnet 5.5 at High, or Opus
    5.5 at High when architectural reasoning is needed.
-   **Critical decisions:** Opus 5.5 at High.
-   **Max effort:** Reserve for the initial architecture decision,
    critical security/architecture synthesis, or a difficult issue where
    High effort has not been sufficient.
-   **Haiku 5.5:** Use only for straightforward, low-risk, repetitive
    tasks.

Do not assume that Max effort is automatically better for every task.
Prefer the lowest effort that produces a correct, verified result.

If the user explicitly selects a model or effort for a task, follow that
selection unless it is unavailable.

## 5. Project-wide engineering principles

### Architecture and boundaries

-   Preserve the existing architecture unless the audit demonstrates a
    concrete reason to change it.
-   Keep portfolio routes lightweight and independent from SaaS-only
    functionality.
-   Do not load Stripe, Shopify, RAG, admin, or SaaS code on public
    portfolio pages unless required.
-   Keep business logic out of presentation components.
-   Keep API contracts, validation, authorization, and data access
    explicit.
-   Avoid circular dependencies and unnecessary abstraction.
-   Prefer small, understandable modules over clever abstractions.
-   Document important architectural decisions and their trade-offs.

### Next.js and frontend

-   Use Server Components by default.
-   Use Client Components only for actual browser-side interactivity or
    state.
-   Keep client component boundaries as small as practical.
-   Avoid importing server-only code into client bundles.
-   Use the framework's image, font, metadata, and rendering
    capabilities appropriately.
-   Avoid unnecessary client-side data fetching when server rendering is
    more suitable.
-   Do not add animation or UI libraries without a clear benefit.
-   Ensure layouts work on small mobile screens, not just desktop.

### Backend and integrations

-   Preserve clear separation between routes/controllers, services,
    validation, and data access where the current codebase supports it.
-   Validate untrusted input at API boundaries.
-   Enforce authorization on the server for every protected operation.
-   Verify Stripe webhook signatures and make webhook processing
    idempotent.
-   Handle retries, duplicate events, and failed external services
    safely.
-   Keep Shopify and AI provider secrets server-side.
-   Apply timeouts, error handling, and sensible rate limits to external
    calls.
-   Do not expose internal errors, secrets, or sensitive records to
    clients.

### Authentication and tenant isolation

-   Review the existing admin and SaaS authentication design before
    changing it.
-   Treat frontend route guards as user experience, not as the security
    boundary.
-   Enforce roles, ownership, and tenant access on the backend.
-   Check cookie flags, expiration, refresh/logout behavior, CSRF
    exposure, and session invalidation.
-   Do not merge or casually reuse admin and SaaS identities or
    authorization rules.
-   For RAG, verify that retrieval cannot return documents a user or
    tenant is not authorized to access.

### Design system and UI migration

-   Establish one authoritative set of design tokens.
-   Remove legacy tokens only after locating and migrating their
    consumers.
-   Avoid maintaining duplicate components that serve the same purpose.
-   Fix missing imports using the intended component architecture; do
    not create arbitrary placeholder components to silence errors.
-   Preserve the approved visual direction across pages.
-   Prefer lightweight gradients and restrained effects over large,
    expensive blur surfaces, especially on mobile.
-   Respect reduced-motion preferences.
-   Avoid layout shifts by reserving image/media dimensions and loading
    fonts carefully.

## 6. Performance objectives

Aim for excellent real-user performance, not just a high synthetic
score.

Use Google's "good" Core Web Vitals thresholds at the 75th percentile as
the baseline:

-   **LCP:** 2.5 seconds or less.
-   **INP:** 200 milliseconds or less.
-   **CLS:** 0.1 or less.

Additional project aspirations:

-   Target Lighthouse Performance 95+ on important public pages under a
    documented, repeatable test setup.
-   Test mobile and desktop separately.
-   Record the test URL, device/emulation, network conditions, date, and
    results.
-   Profile before optimizing; do not guess at bottlenecks.
-   Track JavaScript shipped to public pages.
-   Optimize the hero's critical rendering path.
-   Use appropriately sized modern images and avoid loading
    below-the-fold media eagerly.
-   Load the AI assistant and other nonessential interactive features
    lazily when appropriate.
-   Avoid unnecessary third-party scripts.
-   Verify caching behavior and avoid stale or private data leaks.

A Lighthouse score is not proof of top-1% performance. Do not claim a
percentile ranking without a defined benchmark dataset and comparable
test conditions.

## 7. SEO and discoverability objectives

Build a technically sound, useful, crawlable website.

Review and implement as appropriate:

-   Unique, accurate page titles and meta descriptions.
-   Canonical URLs.
-   XML sitemap and robots rules.
-   Correct status codes and redirect behavior.
-   Semantic HTML and logical heading structure.
-   Descriptive internal links.
-   Open Graph and social sharing metadata.
-   Appropriate structured data, such as Person, WebSite, Article, and
    project-related markup where valid.
-   Indexable server-rendered content for important public pages.
-   Image alt text that describes meaningful images.
-   Search Console verification and index coverage monitoring.
-   Fast, stable public pages.

For AI search discoverability:

-   Publish clear, factual, well-structured content.
-   Explain projects, decisions, technologies, and outcomes in
    accessible language.
-   Make author identity and expertise clear.
-   Avoid keyword stuffing, fabricated claims, and unsupported "AI SEO"
    tricks.
-   Do not promise rankings or inclusion in AI-generated answers.

## 8. Required workflow for every task

1.  **Understand:** Restate the requested outcome briefly and identify
    constraints.
2.  **Inspect:** Read only the relevant files and their immediate
    dependencies.
3.  **Plan:** For nontrivial changes, list affected files,
    implementation steps, and risks.
4.  **Confirm scope:** Do not expand into unrelated cleanup or redesign.
5.  **Implement:** Make the smallest complete change that solves the
    problem.
6.  **Verify:** Run relevant lint, type-check, tests, build, or browser
    checks.
7.  **Report:** Summarize changed files, verification performed,
    results, and unresolved risks.

For a small, obvious task, do not waste tokens producing a lengthy plan.
Proceed directly while keeping the scope narrow.

## 9. Token and context efficiency

-   Do not repeatedly inspect the entire repository.
-   Do not repeat architecture descriptions already documented.
-   Do not rewrite working files when a targeted edit is sufficient.
-   Do not run broad searches without a reason.
-   Do not read generated files, build output, dependency folders, or
    large lockfiles unless needed.
-   Use focused commands and targeted tests.
-   Summarize discoveries in concise, durable notes when a multi-step
    task requires handoff.
-   Use `/compact` when a long session contains useful context that must
    be retained.
-   Use `/clear` when switching to an unrelated task after saving
    necessary decisions and progress.
-   Avoid parallel agents exploring the same files unless the work is
    genuinely separable.
-   Do not keep Max effort enabled for routine work.

## 10. Change-safety rules

-   Never modify production data or run destructive database operations
    without explicit approval.
-   Never expose, print, commit, or copy secrets into documentation.
-   Never change environment variables, authentication behavior, billing
    logic, webhook behavior, or access control casually.
-   Never remove a feature simply because it appears unused without
    checking references and runtime behavior.
-   Never introduce a dependency without explaining why it is needed.
-   Never claim tests passed unless they were actually run and passed.
-   If a required test cannot run, state why and what remains
    unverified.
-   Keep changes focused and easy to review.
-   Prefer a Git checkpoint before substantial refactoring.

## 11. Rebuild plan (started November 2026)

Work through these phases in order. Do not start a phase while the
previous one leaves an architectural problem unresolved. Each phase's
record lives in `docs/rebuild/`; read the latest one before continuing
the rebuild in a new session.

### Phase 1 --- Claude Code environment setup (done)

Project settings, cloud environment, verified commands and a baseline of
every CI check. Record: `docs/rebuild/phase-1-environment.md`.

### Phase 2 --- Understand the existing project (read-only)

**Status:** done; record in `docs/rebuild/phase-2-audit.md`. Phase 3
waits for the user's answers to its section 12.

**Model:** Opus 5.5, High.

Inspect the whole repository before changing anything: architecture,
structure, frontend and backend, data models, authentication and
authorization, APIs and integrations, existing functionality,
dependencies and current problems.

Deliver in `docs/rebuild/phase-2-audit.md`: architecture map; frontend
and backend boundary assessment; authentication and security findings
(including dependency advisories); integration reliability findings;
performance and SEO findings; UI findings; technical debt ranked by
severity; KEEP / FIX / REFACTOR / REDESIGN per area with evidence; and
each feature with its purpose, so the user can decide what is
unnecessary.

Do not change code during this phase.

### Phase 3 --- Architecture and implementation plan

**Status:** approved 2026-11-23; plan in `docs/rebuild/phase-3-plan.md`.
Hosting chosen: Netlify Free (site) + Render Free (API; Koyeb closed
sign-ups on 2026-11-24), DNS at Namecheap;
setup in `docs/deploy.md`. Keep it at $0: no paid plan without the user's
approval.

**Model:** Opus 5.5, High / Max.

Turn the audit into a target architecture and an ordered implementation
plan in `docs/rebuild/phase-3-plan.md`. Record each decision and its
trade-offs, checked against current official documentation and
versions. The user approves the scope (especially any feature removal)
and the plan before Phase 4 starts.

### Phase 4 --- Complete the MVP

**Status:** in progress on `rebuild/phase-4-mvp`, following
`docs/rebuild/phase-3-plan.md` section 4. Progress, findings and test
counts: `docs/rebuild/phase-4-mvp.md`.

**Model:** Sonnet 5.5, High; Opus 5.5, High for security-critical work.

Make the intended functionality work correctly end to end before working
on appearance: security fixes, dependency upgrades, integration
correctness, reliability, consistency and tests. A feature is complete
only when it has been tested (unit, e2e, or a documented run in a real
browser).

### Phase 5 --- UI/UX

**Model:** Opus 5.5, High for design-system decisions; Sonnet 5.5,
Medium / High for implementation.

Only after the MVP is verified. Establish one design system (tokens,
typography, spacing, colour, surfaces, motion, responsive rules), then
rebuild the homepage and the remaining pages one at a time, designing
desktop and mobile intentionally. The result must be distinctive and
authentic (section 1). Measure performance (section 6) and SEO
(section 7) as part of the work, and finish with production readiness:
security, authorization, integration failure handling, accessibility,
responsive behaviour, deployment, monitoring and real-user performance.

The earlier seven-phase sequence (audit, architecture approval, design
system, hero, UI migration, performance and SEO, production readiness)
maps onto Phases 2 to 5; its deliverables are kept above.

## 12. Definition of done

A task is not complete merely because the code was generated.

It is complete when:

-   The requested behavior is implemented.
-   The change follows the approved architecture.
-   Relevant checks have been run.
-   No unrelated functionality was knowingly broken.
-   Security implications have been considered.
-   The result is responsive and accessible where applicable.
-   Remaining limitations are stated honestly.

A release is not ready until the critical security, billing,
data-isolation, and production checks have been verified.

## 13. Communication style

The user prefers direct, honest, practical guidance.

-   Be explicit about what is known, uncertain, and unverified.
-   Do not disguise uncertainty with vague confidence.
-   Do not overwhelm the user with unnecessary explanations.
-   Explain important architectural trade-offs in plain language.
-   Give exact commands and file paths when recommending actions.
-   Do not ask the user to repeat information already available in this
    file.
-   Ask only when a decision genuinely requires user input.
-   In chat, show only what the user needs to do (decisions, approvals,
    actions). Keep findings and details in `docs/`; show them in chat
    only when the user asks.

## 14. Environment and verification commands

-   **Node 24** (`.nvmrc`; CI uses 24; `engines` allows 22.18+).
-   Two independent npm packages, `client/` (Next.js) and `server/`
    (Express), each with its own lockfile. There is no root package.
-   In each package: `npm ci`, `npm run lint`, `npx tsc --noEmit`,
    `npm test`, `npm run build`. Client e2e: `npm run test:e2e`
    (Playwright; it starts the mock API and a production build on port
    3100 itself). These mirror `.github/workflows/ci.yml`; run the
    relevant ones before every commit that touches code.
-   Dependency advisories: `npm audit --omit=dev` in each package.
-   Without a `client/.env.local`, the client build and e2e need the
    placeholder public values from `ci.yml`.
-   **Cloud sessions** run on the `portfolio` environment. Its setup
    script makes Node 24 the default and installs both packages and the
    Playwright browser the client pins. If `node --version` still shows
    22, prefix commands with `PATH=/opt/node24/bin:$PATH`. If e2e
    reports port 3100 in use, an earlier run left `next-server` running:
    find it and stop it.
-   **Docs reachable from cloud sessions:** nextjs.org, react.dev,
    expressjs.com, mongoosejs.com, www.mongodb.com, docs.stripe.com,
    ai.google.dev, aistudio.google.com, docs.voyageai.com, tailwindcss.com,
    playwright.dev, zod.dev, developer.mozilla.org,
    cheatsheetseries.owasp.org, web.dev, developers.google.com and
    code.claude.com, plus the package registries. Check versions with
    `npm view <package> version`. In cloud sessions the page-fetch tool
    cannot reach these hosts; fetch them with `curl` (which goes through
    the environment's proxy) into a new scratch folder and read the text.
    Google's Gemini model docs live on aistudio.google.com.
    fastdl.mongodb.org is allowed so database-backed tests can download
    MongoDB.
-   **Next.js docs for the installed version** ship with the package:
    `client/node_modules/next/dist/docs/`. Read the relevant page there
    before using a Next.js API (see `client/AGENTS.md`).
-   **Secrets:** real `.env` files are never committed, and
    `.claude/settings.json` denies Claude reading or editing them.
    Document variables in the `.env.example` files. When a local run
    needs values, pass test values in that one command's environment.

## 15. Skills and tools

Use these when they apply; do not add tools that duplicate them.

-   `security-review`: after any change to authentication, billing,
    webhooks, input handling or dependencies, and at the end of each
    phase.
-   `code-review`: review the diff before finishing a significant change
    or a phase.
-   `simplify`: clean up a finished change (quality only, not bugs).
-   `run`: start the app and confirm a change in a real browser. For
    repeatable checks use the Playwright and axe suites in `client/e2e`.
-   `frontend-design`: visual direction in Phase 5.
-   `ui-ux-pro-max` (project skill, `.claude/skills/`): accessibility and
    UX checklists and stack guidance. Do not let its catalogue of styles,
    palettes and font pairings choose the visual identity; that is the
    template look section 1 rules out.
-   Web search and page fetching: official documentation first; use
    third-party articles only to find the official source.
-   Not used: UI-generation plugins (such as 21st.dev), whose generic
    components conflict with section 1.

## 16. Git workflow

-   Never commit directly to `main`. Each rebuild phase works on its own
    branch, `rebuild/phase-<n>-<topic>`.
-   Commit small, meaningful changes without asking, in the existing
    style `type(scope): summary` (feat, fix, refactor, perf, test, docs,
    chore, ci; scopes such as client, server, shop). One logical change
    per commit, with the relevant checks passing.
-   Push the branch after each commit or small group of commits: cloud
    containers are discarded.
-   Open a pull request only when the user asks.
-   Never commit secrets, `.env` files, build output or QA media.
-   **The user is the repository's only contributor.** Before the first
    commit in a session, set `git config user.name` and `user.email` to
    the author shown by `git log -1 --format='%an <%ae>' origin/main`.
    No AI co-author lines, session links or "Generated with" lines in
    commits or pull requests.

**North star:** Make the existing project trustworthy, then make it
exceptional. Do not sacrifice maintainability, security, or real-world
speed for visual effects, unnecessary features, or a superficial
Lighthouse score.
