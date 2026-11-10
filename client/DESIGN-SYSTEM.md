# Design system

The source of truth for the frontend's visual language. Tokens live in
`src/app/globals.css`; this file explains the decisions behind them.

## Concept

"Concrete and ink": the identity of a civil engineer who builds software.
It borrows from engineering drawings — dimension lines, title blocks,
column guides — and uses them only where they carry information.

Spend boldness in one place per page (the hero headline, a product
preview). Keep everything around it quiet.

## Color

| Token | Value | Role |
| --- | --- | --- |
| Concrete | `#ecedea` | Page background |
| Ink | `#0f2233` | Text; background of dark product sections |
| Steel | `#5b6670` | Secondary text (5.0:1 on Concrete) |
| Rule | `#c9ccc7` | Hairlines and dividers (decorative) |
| Control | `#7d8680` | Form-field borders (3.2:1, meets non-text contrast) |
| Cyanotype | `#1f4fd8` | Links, focus ring, the assistant launcher (5.6:1) |
| Cyanotype light | `#8fb0ff` | Accent on Ink sections (7.6:1 on Ink) |

Components use semantic names only (`background`, `foreground`,
`muted-foreground`, `border`, `input`, `primary`, `accent`, `ring`…).
Wrapping a section in `.theme-ink` re-maps those names for a dark
surface, so the same components work on both without `dark:` variants.

Never use `text-muted` or `text-secondary` for text: `muted` and
`secondary` are surface colors. Text uses `text-foreground` or
`text-muted-foreground`.

## Type

- **Archivo** (variable: weight + width) for the interface. Headlines use
  the width axis: `font-wide` (118%) for display and section titles,
  `font-semiwide` (108%) for smaller titles. Body text stays at normal width.
- **Newsreader** (variable weight, no optical-size axis, ~57 KB) for
  case-study long-form only. It is declared in the root layout so its
  `@font-face` stays in the single global stylesheet (declaring it in the
  route created a second render-blocking CSS file), and it is not preloaded:
  browsers only download a face that rendered text uses, so only case-study
  pages fetch it. Cost: case-study FCP is ~0.5 s later in Lighthouse's
  mobile simulation; the page still scores 95.
- Numbers in data use `tabular-nums`, not a monospace face.

Scale (all in `@theme`): `text-display` (hero only), `text-h1`, `text-h2`,
`text-title` (project titles), `text-h3`, `text-lead`, then Tailwind's
`text-base` / `text-sm`. Body is 16px / 1.6. Headings use `text-wrap: balance`.

Avoid: all-caps labels, accenting one word in a headline, eyebrows above
every heading, numbered markers on content that isn't a sequence.

## Layout

- `container-page`: max 84rem with fluid gutters (`--gutter`).
- `py-section`: fluid vertical rhythm between sections (`--section`).
- A 12-column grid at `lg`; content left-aligned. Section headings usually
  take 4–5 columns with content starting at column 6.
- Lists of things (projects, steps, notes) are ledgers: rows separated by
  hairlines, not grids of identical cards.

Radii follow hierarchy: controls are pills (`rounded-full`), panels and
frames use `rounded-md`–`rounded-xl`. Shadows only on floating elements
(chat launcher and panel, product preview).

## Motion

Budget per page: one load sequence, at most two or three scroll reveals,
one pointer effect. Everything is CSS except the pointer light.

- `motion-draw` / `motion-rise` with a `--delay` custom property: the hero
  load sequence. **The LCP element (headline and intro) is never animated.**
- `reveal`: CSS scroll-driven animation (`animation-timeline: view()`),
  applied only where `@supports` passes. No JavaScript.
- Route changes: React `<ViewTransition>` (`experimental.viewTransition`).
  Project titles carry from the work list into the case study.
- `PointerLight`: transform-only, fine pointers only, off with reduced motion.
- All motion is disabled under `prefers-reduced-motion: reduce`.
- Animate `transform` and `opacity` only. No blur filters or `backdrop-filter`.

## Performance rules

- Server Components by default. Client components today: `SiteNav`,
  `ChatLauncher` (panel lazy-loaded on intent), `OpenChatButton`,
  `PointerLight`, forms, and dashboard navigation.
- No animation, 3D or UI libraries. `lucide-react` icons only.
- `src/lib/config.ts` must stay dependency-free: it is imported by browser
  code. (A schema library there previously added ~64 KB to every page.)
- Images through `next/image` with real `sizes`; the first row eager with
  `fetchPriority="high"`, everything else lazy.
- `experimental.inlineCss` was measured and rejected: on Next 16.2 it
  embedded the stylesheet about three times per page (HTML grew from ~12 KB
  to ~42 KB gzipped). Re-measure before enabling it on a future version.
- Fonts: one preloaded file (Archivo, ~88 KB for both axes). Adding a
  family or axis needs a measured reason.

## Case-study format

The CMS stores plain text. `src/lib/case-study.ts` renders:
one paragraph per line, `## Heading`, `### Subheading`, and `- list item`.
No HTML is interpreted.
