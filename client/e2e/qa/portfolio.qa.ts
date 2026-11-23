import { expect, test } from './support/fixtures';
import { expectHitTarget } from '../support';

/**
 * A visitor browsing the public site, with motion on (as most visitors see
 * it): the hero scene, both hero buttons, every home section, the header
 * navigation, the work index, a case study and the SaaS page.
 */

test.use({ reducedMotion: 'no-preference' });

test.beforeEach(async ({ diag }) => {
  diag.expect(/\/auth\/me/, 'signed-out session check');
});

test('visitor browses home, work, a case study and SaaS', async ({ page, media, diag }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'the phone journey is in mobile.qa.ts');
  media.video('portfolio', 'public-browsing-journey');

  await page.goto('/');
  const hero = page.getByRole('region', { name: 'Your product, built to hold up.' });
  await expect(hero).toBeVisible();
  await media.pause(1200);
  await media.shot('homepage', 'hero-above-the-fold');

  // The pinned scene plays as the page scrolls.
  const sceneActive = await page.evaluate(() => {
    const stage = document.querySelector('.hs-stage');
    return CSS.supports('animation-timeline: view()') && stage !== null && getComputedStyle(stage).position === 'sticky';
  });
  diag.note('heroSceneActive', sceneActive);
  await media.smoothScrollTo(page.locator('.hs-stage').locator('xpath=..'));
  await page.mouse.wheel(0, 700);
  await media.pause(700);
  await media.shot('homepage', 'hero-scroll-scene-midway');
  await media.smoothScrollTo('top');

  // "See the work" jumps to the work section.
  const seeWork = hero.getByRole('link', { name: 'See the work' });
  await expectHitTarget(seeWork);
  await seeWork.click();
  await expect(page).toHaveURL(/#work$/);
  await expect(page.locator('#work')).toBeInViewport();
  await media.pause();
  await media.shot('homepage', 'selected-work-section');

  // The rest of the home page, section by section.
  for (const [id, name] of [
    ['systems-title', 'live-systems-section'],
    ['about-title', 'about-section'],
    ['activity-title', 'github-activity-section'],
  ] as const) {
    const heading = page.locator(`#${id}`);
    if ((await heading.count()) === 0) {
      diag.note(`missing-section-${id}`, true);
      continue;
    }
    await media.smoothScrollTo(heading);
    await media.pause(700);
    await media.shot('homepage', name);
  }
  await media.smoothScrollTo('bottom');
  await media.pause(700);
  await media.shot('homepage', 'footer');

  // Header navigation to the work index.
  await media.smoothScrollTo('top');
  const nav = page.getByRole('navigation').first();
  const workLink = nav.getByRole('link', { name: 'Work', exact: true });
  if (await workLink.isVisible()) {
    await workLink.click();
  } else {
    await page.getByRole('button', { name: 'Menu' }).click();
    await media.pause(500);
    await page.locator('#site-menu').getByRole('link', { name: 'Work' }).click();
  }
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Work');
  await media.pause();
  await media.shot('portfolio', 'work-index');

  // A case study, if the API has any published.
  const caseStudy = page.locator('main a[href^="/projects/"]').first();
  const hasProjects = (await caseStudy.count()) > 0;
  diag.note('publishedProjectsShown', hasProjects ? await page.locator('main a[href^="/projects/"]').count() : 0);
  if (hasProjects) {
    await caseStudy.click();
    await expect(page).toHaveURL(/\/projects\/[^/]+$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await media.pause();
    await media.shot('portfolio', 'case-study-top');
    await media.smoothScrollTo('bottom');
    await media.pause(600);
    await media.shot('portfolio', 'case-study-end');
  } else {
    await media.shot('errors', 'work-index-without-case-studies', { fullPage: true });
  }

  // SaaS landing.
  await page.goto('/saas');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Stars, subscribers, mentions\. One dashboard\./);
  await media.pause();
  await media.shot('portfolio', 'saas-landing-top');
  await media.smoothScrollTo('bottom');
  await media.pause(600);

  // Back home with the logo/home link.
  await page.goto('/');
  await expect(hero).toBeVisible();
  await media.pause(800);

  expect(diag.unexpected().filter((p) => p.kind === 'page-error')).toEqual([]);
});

test('hero "Plan your project" opens the assistant in planning mode', async ({ page, media, isMobile }) => {
  await page.goto('/');
  const plan = page.getByRole('region', { name: 'Your product, built to hold up.' }).getByRole('button', { name: 'Plan your project' });
  await expectHitTarget(plan);
  await (isMobile ? plan.tap() : plan.click());
  const dialog = page.locator('[role="dialog"][aria-labelledby="assistant-title"]');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Plan a project' })).toHaveAttribute('aria-pressed', 'true');
  await media.pause(600);
  await media.shot('ai-assistant', 'opened-from-hero-plan-mode');
});

test('assistant panel closes with Escape and with its close button', async ({ page }) => {
  await page.goto('/');
  const launcher = page.getByRole('button', { name: /assistant|ask/i }).last();
  await launcher.click();
  const dialog = page.locator('[role="dialog"][aria-labelledby="assistant-title"]');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await launcher.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Close assistant' }).click();
  await expect(dialog).toBeHidden();
});
