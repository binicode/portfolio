import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test as base, expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import { QA } from '../settings';

/**
 * Fixtures for the QA run.
 *
 * - `media` saves screenshots and the test's video into portfolio-media/
 *   under descriptive names, and paces journeys so the videos are readable.
 * - `diag` records console errors and warnings, uncaught page errors, failed
 *   requests and HTTP error responses for every test, and writes them to
 *   portfolio-media/reports/raw/<project>/<test>.json for the report. A test
 *   marks the responses it causes on purpose (a 401 it is checking for) with
 *   `diag.expect(...)`, so the report can tell them from real problems.
 */

export type ShotCategory =
  | 'desktop'
  | 'tablet'
  | 'mobile'
  | 'homepage'
  | 'portfolio'
  | 'dashboard'
  | 'admin'
  | 'ai-assistant'
  | 'errors';

export type VideoCategory = 'portfolio' | 'authentication' | 'dashboard' | 'admin' | 'ai-assistant' | 'mobile';

interface ShotOptions {
  fullPage?: boolean;
  /** Screenshot just this element. */
  locator?: Locator;
  /** Covered with a solid grey box in the image (viewport and element shots). */
  mask?: Locator[];
}

export interface Media {
  /** Saves screenshots/<category>/<device>-<name>.png (or <category>/<name>.png for a device folder). */
  shot(category: ShotCategory, name: string, options?: ShotOptions): Promise<string>;
  /** Keeps this test's video as videos/<category>/<device>-<name>.webm. */
  video(category: VideoCategory, name: string): void;
  /** A beat for the video: lets a state settle on screen before the next step. */
  pause(ms?: number): Promise<void>;
  /** Scrolls in small steps, so the video shows the page instead of jumping. */
  smoothScrollTo(target: Locator | 'bottom' | 'top'): Promise<void>;
}

interface Problem {
  kind: 'console-error' | 'console-warning' | 'page-error' | 'request-failed' | 'http-error';
  text: string;
  url?: string;
  status?: number;
  expected?: string;
}

export interface Diagnostics {
  /** Marks matching http errors / failed requests / console errors as caused on purpose. */
  expect(pattern: RegExp, reason: string): void;
  /** A fact worth reporting (e.g. where an AI answer came from). */
  note(key: string, value: unknown): void;
  problems(): Problem[];
  unexpected(): Problem[];
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/["'’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);

const device = (testInfo: TestInfo) => testInfo.project.name;

function ensureDir(file: string) {
  mkdirSync(path.dirname(file), { recursive: true });
}

/** Waits for web fonts and two frames, so a screenshot never catches a fallback font or a half-applied state. */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

/**
 * A full-page capture draws fixed overlays where the first screen was, as a
 * box over the long image. For these shots only: the site's frame borders
 * the whole page, and fixed overlays (the assistant launcher) are hidden.
 * Viewport shots show them as they are.
 */
async function fullPageShot(page: Page, file: string): Promise<void> {
  const style = await page.addStyleTag({
    content: '.site-frame{position:relative}.site-frame::after{position:absolute}',
  });
  await page.evaluate(() => {
    for (const element of document.querySelectorAll<HTMLElement>('body *')) {
      const position = getComputedStyle(element).position;
      if (position === 'fixed' && element.offsetParent === null && element.getClientRects().length > 0) {
        element.dataset.qaHidden = element.style.visibility;
        element.style.visibility = 'hidden';
      }
    }
  });
  await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
  await page.evaluate(() => {
    for (const element of document.querySelectorAll<HTMLElement>('[data-qa-hidden]')) {
      element.style.visibility = element.dataset.qaHidden ?? '';
      delete element.dataset.qaHidden;
    }
  });
  await style.evaluate((node) => (node as HTMLElement).remove());
}

export const test = base.extend<{ media: Media; diag: Diagnostics }>({
  diag: [
    async ({ page }, provide, testInfo) => {
      const problems: Problem[] = [];
      const allowed: Array<{ pattern: RegExp; reason: string }> = [];
      const notes: Record<string, unknown> = {};

      page.on('console', (message) => {
        const type = message.type();
        if (type !== 'error' && type !== 'warning') return;
        const { url, lineNumber } = message.location();
        problems.push({
          kind: type === 'error' ? 'console-error' : 'console-warning',
          text: message.text(),
          url: url ? `${url}:${lineNumber}` : undefined,
        });
      });
      page.on('pageerror', (error) => problems.push({ kind: 'page-error', text: error.message }));
      page.on('requestfailed', (request) => {
        const failure = request.failure()?.errorText ?? 'failed';
        // Navigations and prefetches the browser abandons on purpose are not failures.
        if (failure === 'net::ERR_ABORTED') return;
        problems.push({ kind: 'request-failed', text: `${request.method()} ${failure}`, url: request.url() });
      });
      page.on('response', (response) => {
        if (response.status() < 400) return;
        problems.push({
          kind: 'http-error',
          text: `${response.request().method()} ${response.status()} ${response.statusText()}`,
          url: response.url(),
          status: response.status(),
        });
      });

      const classify = () =>
        problems.map((problem) => {
          const hay = `${problem.text} ${problem.url ?? ''}`;
          const match = allowed.find(({ pattern }) => pattern.test(hay));
          return match ? { ...problem, expected: match.reason } : problem;
        });

      await provide({
        expect: (pattern, reason) => allowed.push({ pattern, reason }),
        note: (key, value) => {
          notes[key] = value;
        },
        problems: classify,
        unexpected: () => classify().filter((problem) => !problem.expected),
      });

      const file = path.join(QA.mediaDir, 'reports', 'raw', `${device(testInfo)}`, `${slug(testInfo.titlePath.slice(1).join(' '))}.json`);
      ensureDir(file);
      writeFileSync(
        file,
        JSON.stringify(
          {
            test: testInfo.titlePath.slice(1).join(' › '),
            project: device(testInfo),
            status: testInfo.status,
            durationMs: testInfo.duration,
            error: testInfo.error?.message?.split('\n')[0],
            notes,
            problems: classify(),
            attachments: testInfo.attachments.filter((a) => a.path?.includes('portfolio-media')).map((a) => a.path),
          },
          null,
          2,
        ),
      );
    },
    { auto: true },
  ],

  media: async ({ page }, provide, testInfo) => {
    let videoTarget: string | null = null;

    const media: Media = {
      async shot(category, name, options = {}) {
        const isDeviceFolder = category === 'desktop' || category === 'tablet' || category === 'mobile';
        const file = path.join(
          QA.mediaDir,
          'screenshots',
          category,
          isDeviceFolder ? `${slug(name)}.png` : `${device(testInfo)}-${slug(name)}.png`,
        );
        ensureDir(file);
        await settle(page);
        // Password fields render as bullets and only ever hold the run's test
        // values, so they are not masked; anything passed in `mask` is covered
        // in a neutral grey rather than Playwright's default magenta.
        const mask = options.mask ?? [];
        const maskColor = '#8a8f8c';
        if (options.locator) {
          await options.locator.screenshot({ path: file, mask, maskColor });
        } else if (options.fullPage) {
          // Chromium resizes the page to capture it whole, and a recording
          // shows that as a shrunken frame. While this test's video is kept,
          // the full page is captured from a second tab on the same URL
          // (same session), so the video stays clean.
          const target = videoTarget ? await page.context().newPage() : page;
          if (target !== page) {
            // 'load' includes streamed (Suspense) content; 'networkidle' took ~30 s
            // on the dashboard and left the recorded tab idle in the background.
            await target.goto(page.url(), { waitUntil: 'load' });
            await settle(target);
          }
          await fullPageShot(target, file);
          if (target !== page) {
            await target.close();
            await page.bringToFront();
          }
        } else {
          await page.screenshot({ path: file, mask, maskColor });
        }
        await testInfo.attach(path.basename(file), { path: file, contentType: 'image/png' });
        return file;
      },
      video(category, name) {
        videoTarget = path.join(QA.mediaDir, 'videos', category, `${device(testInfo)}-${slug(name)}.webm`);
      },
      async pause(ms = 900) {
        await page.waitForTimeout(ms);
      },
      async smoothScrollTo(target) {
        const goal = await page.evaluate(
          (t) => (t === 'bottom' ? document.documentElement.scrollHeight : 0),
          typeof target === 'string' ? target : 'top',
        );
        const y =
          typeof target === 'string'
            ? goal
            : await target.evaluate((element) => element.getBoundingClientRect().top + window.scrollY - 80);
        for (let i = 0; i < 400; i++) {
          const now = await page.evaluate(() => window.scrollY);
          const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
          const want = Math.max(0, Math.min(y, max));
          if (Math.abs(now - want) < 4) break;
          const step = Math.sign(want - now) * Math.min(Math.abs(want - now), 140);
          await page.mouse.wheel(0, step);
          await page.waitForTimeout(45);
          if ((await page.evaluate(() => window.scrollY)) === now) {
            // Wheel ignored (touch emulation): scroll directly.
            await page.evaluate((top) => window.scrollTo({ top }), now + step);
          }
        }
        // Land exactly, whatever smooth scrolling or touch emulation did on the way.
        await page.evaluate((top) => {
          const max = document.documentElement.scrollHeight - window.innerHeight;
          window.scrollTo({ top: Math.max(0, Math.min(top, max)), behavior: 'instant' });
        }, y);
        await page.waitForTimeout(300);
      },
    };

    await provide(media);

    const video = page.video();
    if (video && videoTarget) {
      // The file is only complete once its page has closed.
      await page.context().close();
      ensureDir(videoTarget);
      await video.saveAs(videoTarget);
      await testInfo.attach(path.basename(videoTarget), { path: videoTarget, contentType: 'video/webm' });
    }
  },
});

export { expect };
