# Design system

The source of truth for the frontend's visual language. Tokens live in
`src/app/globals.css`; this file explains the decisions behind them.

## Concept

Charcoal and rust: a dark, precise interface for a civil engineer who
builds software. The palette, the tight grotesk headlines and the mono
micro-labels follow the reference the owner chose (an Awwwards product
site with a pinned, scroll-driven hero). The content and drawings stay
specific to this portfolio: structures as a metaphor for the stack.

Spend boldness in one place per page. On the home page that is the hero:
a pinned scene where a small drawing card grows to fill the screen and
becomes an explorer of the stack's layers. Everything around it stays
quiet.

## Drawings

- `components/home/StackDrawing.tsx`: the stack drawn as a building section
  (interface = roof truss, API = floors, data = foundation, services attached),
  with lettered callouts A–D keyed to the explorer tabs.
- `components/work/ProjectPlate.tsx`: five structural motifs (truss bridge,
  column grid, arch, cantilever, strata). A project's plate is chosen by its
  position in the newest-first list, so it matches on the work list and its
  case study (shared view-transition name).
- Inline SVG only, one `<path>` per layer, `vector-effect: non-scaling-stroke`
  for crisp hairlines. Styles live in `globals.css` (`.d-*` classes).
- Drawings are static. Animated SVG transforms cannot be composited and
  repaint the surrounding layer on every frame (measured: ~100 main-thread
  paints during load when the hero drawing assembled itself).

## Color

| Token | Value | Role |
| --- | --- | --- |
| Charcoal 950 | `#0c0c0d` | Page background |
| Charcoal 900 / 850 | `#141315` / `#1c1b1e` | Cards, panels, muted surfaces |
| Line | `#29282c` | Hairlines and dividers (decorative) |
| Bone | `#e4e3e4` | Text, primary buttons (15:1) |
| Ash | `#a3a2a4` | Secondary text (7.4:1) |
| Smoke | `#7d7c7e` | Dim meta text only (`text-dim`, 4.7:1) |
| Rust | `#dd5226` | The single accent: active states, kickers, focus ring, launcher (4.9:1) |
| Rust deep / shadow | `#873417` / `#5f2814` | Gradient stops only (hero frame, footer glow); never text |

Components use semantic names only (`background`, `foreground`, `card`,
`muted-foreground`, `dim`, `border`, `input`, `primary`, `accent`, `ring`…).

Never use `text-muted` or `text-secondary` for text: `muted` and
`secondary` are surface colors.

Text over the rust gradients needs checking by hand (axe skips gradients):
the hero tab letters use a lighter `#f47b4c` and inactive tabs dim by colour
(Ash), not opacity, so both stay at 4.5:1 or better over the deepest stop.

## Type

- **Inter Tight** for everything readable: headlines at weight 500 with
  tight tracking (`-0.04em` at h1), body at 400. Self-hosted subset in
  `src/app/fonts/` (OFL licence alongside): Latin, weight 400–600, 27 KB,
  preloaded.
- **Geist Mono** for micro-type only, through the `label` utility: nav,
  kickers, meta, captions, button text. ASCII subset, weight 400–500,
  9 KB, not preloaded.
- Both subsets are produced by `npm run fonts:subset`
  (`scripts/subset-fonts.mjs`). Using `font-bold` or characters outside the
  subsets will not render as intended — widen the ranges in that script.
- Numbers in data use `tabular-nums`.

Scale (all in `@theme`): `text-display`, `text-stat` (About numerals),
`text-h1`, `text-h2`, `text-statement` (large reading text, 24px+),
`text-title` (project titles), `text-h3`, `text-lead`, then Tailwind's
`text-base` / `text-sm`. Body is 16px / 1.6. Headings use
`text-wrap: balance`.

`label` (uppercase mono, 11px, +0.04em) is the system's one all-caps
style. Use it for navigation and metadata, not for sentences, and not as
an eyebrow above every heading. A rust `label` kicker is reserved for a
page's or section's identity (for example "Creator Dashboard").

Avoid: accenting one word in a headline, numbered markers on content
that isn't a sequence.

## Components

- Buttons (`components/ui/button-styles.ts`): rectangular (`rounded-xs`),
  mono uppercase text. Primary is Bone on Charcoal.
- `.btn-bracket`: the outlined rust button with corner brackets, used only
  for Contact (header and mobile menu).
- `.stripe-meter`: the striped header bar; its cover slides with page
  scroll (`scroll(root)`), so it doubles as a reading-progress meter.
- `HeroSystem` (server) + `SystemExplorer` (client): the pinned hero. Tabs
  are a real ARIA tablist (arrows, Home, End), auto-advance every 6 s via a
  CSS progress bar, pause on hover or focus, and stop on manual choice.
- `CursorReadout` (client): X/Y coordinates, fine pointers only, decorative.
- `RevealWords`: splits a statement into words that brighten as they cross
  the viewport (scroll-driven, no JavaScript after render).

## Layout

- `container-page`: max 84rem with fluid gutters (`--gutter`).
- `py-section` / `pb-section`: fluid vertical rhythm (`--section`).
- A 12-column grid at `lg`; content left-aligned. Section headings usually
  take 4–5 columns with content starting at column 6. The hero is centred.
- Lists of things (projects, steps, notes) are ledgers: rows separated by
  hairlines, not grids of identical cards.

Radii are small and follow hierarchy: controls `rounded-xs` (2px), panels
and frames `rounded-md`–`rounded-xl` (4–8px). Shadows only on floating
elements (chat launcher and panel).

## Motion

One orchestrated moment per page; no time-based entrance animations on load.

- Hero: `.hs` is 280vh with a sticky stage and a named view timeline
  (`--hs`). The intro fades out, the drawing frame grows from 30% to full
  size, then the heading and tabs fade in. All scroll-linked, CSS only,
  behind `@supports (animation-timeline: view())`; other browsers get a
  static stacked layout.
- `reveal` and `RevealWords`: scroll-driven (`animation-timeline: view()`).
  Unread words start at 0.45 opacity so the large statement text stays
  above 3:1 at every scroll position.
- Route changes: React `<ViewTransition>` (`experimental.viewTransition`).
- `PointerLight` and `CursorReadout`: fine pointers only, rAF-throttled.
- Animate `transform` and `opacity`. Keep `visibility` (needed to take
  faded controls out of the tab order) in its own animation, so the
  opacity/transform one can run on the compositor.
- When an element has more than one scroll-driven animation, write the
  longhands (`animation-name`, `animation-duration: auto`, …). The CSS
  minifier expands a multi-animation shorthand with `animation-duration: 0s`,
  which makes scroll-driven animations jump straight to their end state.
- All motion is disabled under `prefers-reduced-motion: reduce`.
- No blur filters or `backdrop-filter`.

## Performance rules

- Server Components by default. Client components today: `SiteNav`,
  `ChatLauncher` (panel lazy-loaded on intent), `OpenChatButton`,
  `PointerLight`, `SystemExplorer`, `CursorReadout`, `ShopifyImage`, forms,
  and dashboard navigation.
- No animation, 3D or UI libraries. `lucide-react` icons only.
- `src/lib/config.ts` must stay dependency-free: it is imported by browser
  code. (A schema library there previously added ~64 KB to every page.)
- Images through `next/image` with real `sizes`; the first row eager with
  `fetchPriority="high"`, everything else lazy.
- `experimental.inlineCss` was measured and rejected: on Next 16.2 it
  embedded the stylesheet about three times per page (HTML grew from ~12 KB
  to ~42 KB gzipped). Re-measure before enabling it on a future version.
- Fonts: one preloaded file (Inter Tight, 27 KB) plus Geist Mono (9 KB) on
  first use. Adding a family, weight or range needs a measured reason.
- Measure over HTTP/2: `next start` serves HTTP/1.1, which Lighthouse models
  with six connections per origin and penalises Next's many small chunks.
  Production hosts serve HTTP/2, so local numbers need an HTTP/2 proxy in
  front of `next start` to be representative.

## Case-study format

The CMS stores plain text. `src/lib/case-study.ts` renders:
one paragraph per line, `## Heading`, `### Subheading`, and `- list item`.
No HTML is interpreted.
