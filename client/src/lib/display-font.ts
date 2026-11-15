import localFont from 'next/font/local';

/**
 * The editorial serif (Playfair Display 700, Google's own latin file, OFL;
 * scripts/subset-fonts.mjs). Only the portfolio canvas pages import it, so
 * only they preload it: put `displayFont.variable` on the .canvas-page
 * wrapper and use the `font-display` utility inside.
 */
export const displayFont = localFont({
  src: '../app/fonts/playfair-display-latin-700.woff2',
  variable: '--font-display-face',
  weight: '700',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});
