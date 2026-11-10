// Regenerates the self-hosted font subsets in src/app/fonts/.
//
// Run: npm run fonts:subset
//
// Both families are OFL with no Reserved Font Name (licences alongside the
// files). Each is downloaded from the Google Fonts CSS2 API and reduced to
// what the design uses:
//   - Inter Tight: Google's "latin" range, weight 400–600 (headings + body).
//   - Geist Mono: printable ASCII plus a few symbols, weight 400–500
//     (uppercase micro labels, coordinates).
// If the design starts using a weight outside these ranges, widen them here,
// rerun, and update the matching `weight` values in src/app/layout.tsx.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

// Google Fonts "latin" subset: U+0000-00FF plus these code points.
const LATIN = [
  [0x20, 0xff], [0x131], [0x152, 0x153], [0x2bb, 0x2bc], [0x2c6], [0x2da], [0x2dc], [0x304], [0x308],
  [0x329], [0x2000, 0x206f], [0x20ac], [0x2122], [0x2191], [0x2193], [0x2212], [0x2215], [0xfeff], [0xfffd],
];
// Labels are short, set in uppercase and written by us: ASCII is enough.
const LABELS = [[0x20, 0x7e], [0xa0], [0xa9], [0xb7], [0x2011], [0x2013, 0x2014], [0x2019], [0x2026], [0x2190, 0x2193], [0x2197]];

const FONTS = [
  {
    family: 'Inter Tight',
    out: 'inter-tight-latin-wght400-600.woff2',
    ranges: LATIN,
    axes: { wght: { min: 400, max: 600, default: 400 } },
  },
  {
    family: 'Geist Mono',
    out: 'geist-mono-ascii-wght400-500.woff2',
    ranges: LABELS,
    axes: { wght: { min: 400, max: 500, default: 400 } },
  },
];

const textFor = (ranges) => {
  let text = '';
  for (const [from, to = from] of ranges) for (let c = from; c <= to; c++) text += String.fromCodePoint(c);
  return text;
};

for (const font of FONTS) {
  // A modern browser user agent makes the CSS API return woff2 files.
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${font.family.replace(/ /g, '+')}:wght@100..900&display=swap`,
    { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36' } },
  ).then((r) => r.text());

  const latinFace = css
    .split('@font-face')
    .find((block, i, all) => /\/\* latin \*\/\s*$/.test(all[i - 1] ?? '') && block.includes('U+0000-00FF'));
  const url = latinFace?.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
  if (!url) throw new Error(`Could not find the latin ${font.family} woff2 in the Google Fonts CSS response.`);

  const source = Buffer.from(await fetch(url).then((r) => r.arrayBuffer()));
  const subset = await subsetFont(source, textFor(font.ranges), { targetFormat: 'woff2', variationAxes: font.axes });
  const out = fileURLToPath(new URL(`../src/app/fonts/${font.out}`, import.meta.url));
  writeFileSync(out, subset);
  console.log(`${font.family}: ${(subset.length / 1024).toFixed(1)} KB (source ${(source.length / 1024).toFixed(1)} KB) -> ${font.out}`);
}
