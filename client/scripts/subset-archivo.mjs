// Regenerates src/app/fonts/archivo-latin-wght400-600-wdth100-118.woff2.
//
// Run: npm run fonts:archivo
//
// Downloads Archivo (OFL, no Reserved Font Name) from the Google Fonts CSS2
// API and keeps only what the design uses:
//   - Google's "latin" character range (same coverage as next/font/google),
//   - weight 400–600 (font-normal / font-medium / font-semibold),
//   - width 100–118% (body text, font-semiwide, font-wide).
// That cuts the file from ~88 KB to ~38 KB. If the design starts using a
// weight or width outside these ranges, widen them here, rerun, and update
// the matching values in src/app/layout.tsx.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const AXES = {
  wght: { min: 400, max: 600, default: 400 },
  wdth: { min: 100, max: 118, default: 100 },
};

// Google Fonts "latin" subset: U+0000-00FF plus these code points.
const LATIN = [
  [0x20, 0xff], [0x131], [0x152, 0x153], [0x2bb, 0x2bc], [0x2c6], [0x2da], [0x2dc], [0x304], [0x308],
  [0x329], [0x2000, 0x206f], [0x20ac], [0x2122], [0x2191], [0x2193], [0x2212], [0x2215], [0xfeff], [0xfffd],
];

const OUT = fileURLToPath(new URL('../src/app/fonts/archivo-latin-wght400-600-wdth100-118.woff2', import.meta.url));

// A modern browser user agent makes the CSS API return woff2 files.
const css = await fetch('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36' },
}).then((r) => r.text());

const latinFace = css.split('@font-face').find((block) => /\/\* latin \*\//.test(css.slice(0, css.indexOf(block))) && block.includes('U+0000-00FF'));
const url = latinFace?.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
if (!url) throw new Error('Could not find the latin Archivo woff2 in the Google Fonts CSS response.');

const source = Buffer.from(await fetch(url).then((r) => r.arrayBuffer()));
let text = '';
for (const [from, to = from] of LATIN) for (let c = from; c <= to; c++) text += String.fromCodePoint(c);

const subset = await subsetFont(source, text, { targetFormat: 'woff2', variationAxes: AXES });
writeFileSync(OUT, subset);
console.log(`Wrote ${OUT} (${(subset.length / 1024).toFixed(1)} KB, source ${(source.length / 1024).toFixed(1)} KB)`);
