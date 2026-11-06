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

## 2. Current project status --- source of truth

The project already has a substantial, operational foundation:

-   Next.js 16 client application.
-   Express.js backend.
-   MongoDB Atlas.
-   MongoDB Atlas Vector Search.
-   Google Gemini-powered RAG assistant.
-   Voyage AI embeddings.
-   Stripe subscription billing and webhooks.
-   Headless Shopify integration.
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

## 11. Current priority sequence

Follow this order unless repository evidence reveals a critical issue
that must be addressed first.

### Phase 1 --- Read-only architecture audit

**Model:** Opus 5.5, High. Use Max for the final architecture decision
if needed.

Deliver: - Current architecture map. - Frontend and backend boundary
assessment. - Authentication/security findings. - Integration
reliability findings. - Performance and SEO findings. - UI migration
findings. - Technical debt ranked by severity. - KEEP / FIX / REFACTOR /
REDESIGN decisions. - Recommended target architecture.

Do not change code during this phase.

### Phase 2 --- Approve and document the target architecture

**Model:** Opus 5.5, High / Max.

Resolve the user's architecture concerns. Document decisions and
trade-offs. Do not start a broad redesign until the user approves it.

### Phase 3 --- Stabilize the design system

**Model:** Opus 5.5, High for design-system decisions; Sonnet 5.5,
Medium for implementation.

-   Reconcile new and legacy tokens.
-   Establish typography, spacing, colors, surfaces, radii, and
    responsive rules.
-   Resolve component ownership and missing imports.
-   Avoid broad visual changes outside the approved system.

### Phase 4 --- Refactor and assemble the hero

**Model:** Sonnet 5.5, High.

-   Fix missing imports correctly.
-   Replace expensive mobile blur effects with lightweight gradients or
    simpler effects where visually appropriate.
-   Optimize critical images and fonts.
-   Minimize client-side JavaScript.
-   Check layout stability and mobile rendering.
-   Capture before/after measurements.

### Phase 5 --- Complete the UI migration

**Model:** Sonnet 5.5, Medium / High.

Migrate one page or component group at a time. Reuse the approved design
system. Do not alter backend behavior unless required and approved.

### Phase 6 --- Performance and discoverability

**Model:** Sonnet 5.5, High for implementation and profiling; Opus 5.5,
High for difficult cross-system diagnosis.

Measure and improve Core Web Vitals, page weight, rendering, metadata,
structured data, crawlability, and content quality.

### Phase 7 --- Production readiness

**Model:** Sonnet 5.5, High for test execution and fixes; Opus 5.5, Max
for final architecture/security synthesis.

Verify security, authorization, integration failure handling,
accessibility, responsive behavior, deployment, monitoring, and
real-user performance.

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

**North star:** Make the existing project trustworthy, then make it
exceptional. Do not sacrifice maintainability, security, or real-world
speed for visual effects, unnecessary features, or a superficial
Lighthouse score.
