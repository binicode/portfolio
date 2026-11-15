import { expect, test } from '@playwright/test';
import { expectHitTarget } from './support';

test('home page renders its one h1', async ({ page }) => {
  await page.goto('/');
  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveText('Software engineered to hold up.');
});

// The hero is a pinned, scroll-driven scene only where scroll-driven
// animations are supported and motion is allowed. The click bug this guards
// against (an invisible frame layered over the intro took the buttons'
// clicks) only exists in that mode, so these tests turn reduced motion off
// and check that the scene is really active before clicking.
test.describe('hero buttons take clicks', () => {
  test.use({ reducedMotion: 'no-preference' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const sceneActive = await page.evaluate(() => {
      const stage = document.querySelector('.hs-stage');
      return (
        CSS.supports('animation-timeline: view()') &&
        stage !== null &&
        getComputedStyle(stage).position === 'sticky'
      );
    });
    expect(sceneActive, 'the pinned scroll scene is active').toBe(true);
  });

  test('"Plan your project" opens the assistant', async ({ page, isMobile }) => {
    const hero = page.getByRole('region', { name: 'Software engineered to hold up.' });
    const plan = hero.getByRole('button', { name: 'Plan your project' });

    await expectHitTarget(plan);
    await (isMobile ? plan.tap() : plan.click());

    const dialog = page.locator('[role="dialog"][aria-labelledby="assistant-title"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Portfolio assistant' })).toBeVisible();
  });

  test('"See the work" scrolls to the work section', async ({ page, isMobile }) => {
    const hero = page.getByRole('region', { name: 'Software engineered to hold up.' });
    const seeWork = hero.getByRole('link', { name: 'See the work' });

    await expectHitTarget(seeWork);
    await (isMobile ? seeWork.tap() : seeWork.click());

    await expect(page).toHaveURL(/#work$/);
    await expect(page.locator('#work')).toBeInViewport();
  });
});
