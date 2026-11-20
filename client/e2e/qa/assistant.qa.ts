import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { readStream } from './support/sse';
import { readTappedStreams, tapAssistantStreams } from './support/stream-tap';

/**
 * The assistant against the real API: answers stream from Gemini (keys from
 * the server's env file). Each answer is read from the API's own SSE stream
 * as well as from the screen; a `done` frame carrying token usage proves a
 * model answered, rather than the built-in fallback text.
 */

const CHAT = '**/api/ai-chat/chat';
const DISCOVERY = '**/api/ai-chat/discovery';

test.use({ reducedMotion: 'no-preference', permissions: ['clipboard-read', 'clipboard-write'] });

test.beforeEach(async ({ diag }) => {
  diag.expect(/\/auth\/me/, 'signed-out session check');
});

async function openAssistant(page: Page) {
  await page.getByRole('button', { name: /^(Ask the assistant|Ask AI)$/ }).click();
  const dialog = page.locator('[role="dialog"][aria-labelledby="assistant-title"]');
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe('general chat', () => {
  test.skip(({ isMobile }) => isMobile, 'the phone chat is in mobile.qa.ts');

  test('asks two questions and gets real streamed answers with sources', async ({ page, media, diag }) => {
    media.video('ai-assistant', 'general-chat-conversation');
    await page.goto('/');
    await media.pause(800);
    const dialog = await openAssistant(page);
    await media.pause(800);
    await media.shot('ai-assistant', 'chat-empty-state-with-suggestions');

    // A suggested question.
    const first = page.waitForResponse((r) => r.url().endsWith('/api/ai-chat/chat') && r.request().method() === 'POST');
    await dialog.getByRole('button', { name: 'What have you shipped?' }).click();
    await expect(dialog.getByText('Thinking…')).toBeVisible();
    await media.shot('ai-assistant', 'chat-thinking-state');
    const answer1 = await readStream(await first);
    diag.note('answer1', answer1);
    expect(answer1.status).toBe(200);
    expect(answer1.error, 'no error frame').toBeUndefined();
    expect(answer1.done?.usage?.outputTokens ?? 0, 'Gemini token usage on the done frame').toBeGreaterThan(0);
    const log = dialog.getByRole('log');
    await expect(log).toContainText(answer1.text.trim().slice(0, 40));
    await expect(log.getByText(/^Sources:/).first()).toBeVisible();
    await media.pause(1500);
    await media.shot('ai-assistant', 'chat-first-answer-with-sources', { locator: dialog });

    // A typed follow-up that depends on the conversation so far.
    const input = dialog.getByLabel('Message', { exact: true });
    await input.click();
    await input.pressSequentially('Which of those have you used in a real project with payments?', { delay: 25 });
    await media.pause(500);
    const second = page.waitForResponse((r) => r.url().endsWith('/api/ai-chat/chat') && r.request().method() === 'POST');
    await page.keyboard.press('Enter');
    const answer2 = await readStream(await second);
    diag.note('answer2', answer2);
    expect(answer2.status).toBe(200);
    expect(answer2.done?.usage?.outputTokens ?? 0).toBeGreaterThan(0);
    await expect(log).toContainText(answer2.text.trim().slice(0, 40));
    await expect(dialog.getByRole('button', { name: 'Plan it in 2 minutes' })).toBeVisible();
    await media.pause(1800);
    await media.shot('ai-assistant', 'chat-follow-up-answer', { locator: dialog });

    // The conversation survives a reload (history from the API).
    await page.reload();
    const reopened = await openAssistant(page);
    await expect(reopened.getByRole('log')).toContainText(answer2.text.trim().slice(0, 40));
    await media.pause(1200);
    await media.shot('ai-assistant', 'chat-history-restored-after-reload', { locator: reopened });
  });

  test('loading state: a slow answer shows "Thinking…" until the first words arrive', async ({ page, media }) => {
    await page.route(CHAT, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      await route.continue();
    });
    await page.goto('/');
    const dialog = await openAssistant(page);
    await dialog.getByRole('button', { name: 'What is your background?' }).click();
    await expect(dialog.getByText('Thinking…')).toBeVisible();
    await expect(dialog.getByLabel('Message', { exact: true })).toBeDisabled();
    await media.shot('ai-assistant', 'chat-loading-slow-network', { locator: dialog });
    await expect(dialog.getByText('Thinking…')).toBeHidden({ timeout: 60_000 });
  });

  test('error state: the API unreachable shows the offline message', async ({ page, media, diag }) => {
    diag.expect(/ai-chat\/chat/, 'request aborted on purpose');
    await page.route(CHAT, (route) => route.abort('connectionrefused'));
    await page.goto('/');
    const dialog = await openAssistant(page);
    await dialog.getByRole('button', { name: 'How do you handle payments?' }).click();
    await expect(dialog.getByText('The assistant is offline. Try again soon.')).toBeVisible();
    await media.shot('errors', 'chat-api-unreachable', { locator: dialog });
  });

  test('error state: the rate limit answer (429) is shown, not swallowed', async ({ page, media, diag }) => {
    diag.expect(/ai-chat\/chat/, '429 returned on purpose');
    await page.route(CHAT, (route) =>
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'You have reached the chat limit for now. Please try again shortly.' } }),
      }),
    );
    await page.goto('/');
    const dialog = await openAssistant(page);
    await dialog.getByRole('button', { name: 'What have you shipped?' }).click();
    const bubble = dialog.getByRole('log').locator('div.rounded-2xl').last();
    await expect(bubble).not.toHaveText('Thinking…');
    diag.note('rateLimitMessageShown', await bubble.innerText());
    await media.shot('errors', 'chat-rate-limited-429', { locator: dialog });
  });
});

/** Picks a single-choice option, or ticks several and continues. */
async function choose(page: Page, labels: string[], multiple = false) {
  const dialog = page.locator('[role="dialog"][aria-labelledby="assistant-title"]');
  for (const label of labels) {
    await dialog.getByRole('button', { name: label, exact: true }).click();
    await page.waitForTimeout(250);
  }
  if (multiple) await dialog.getByRole('button', { name: 'Continue' }).click();
}

test.describe('Plan a project', () => {
  test.skip(({ isMobile }) => isMobile, 'the phone discovery run is in mobile.qa.ts');

  test('answers every question and gets AI recommendations and a brief', async ({ page, media, diag }) => {
    media.video('ai-assistant', 'plan-a-project-discovery-to-brief');
    // The discovery `done` frame carries no usage, and the server has no
    // fallback text of its own: streamed tokens that match the screen are the
    // evidence that the AI wrote what the visitor reads.
    await tapAssistantStreams(page);

    await page.goto('/');
    await media.pause(600);
    const dialog = await openAssistant(page);
    await dialog.getByRole('button', { name: 'Plan a project' }).click();
    await expect(dialog.getByText('What are you building?')).toBeVisible();
    await media.pause(900);
    await media.shot('ai-assistant', 'discovery-first-question');

    await choose(page, ['Web app']);
    await expect(dialog.getByText('Where are you now?')).toBeVisible();
    await choose(page, ['Planning it']);
    // First AI checkpoint: a recommendation after the stage.
    const insight1 = dialog.locator('p.border-l-2').first();
    await expect(insight1).toBeVisible();
    await expect(dialog.getByText(/What should .* solve\?/)).toBeVisible({ timeout: 20_000 });
    await media.pause(1500);
    await media.shot('ai-assistant', 'discovery-first-recommendation', { locator: dialog });

    await choose(page, ['Replace manual work', 'Turn data into insight'], true);
    await expect(dialog.getByText('Who will use it?')).toBeVisible();
    await choose(page, ['Businesses']);
    await expect(dialog.getByText('What should users be able to do?')).toBeVisible();
    await choose(page, ['Sign up and log in', 'See dashboards', 'Search and filter'], true);
    await expect(dialog.getByText('Does it need any of these?')).toBeVisible();
    await media.shot('ai-assistant', 'discovery-multiple-choice-question', { locator: dialog });
    await choose(page, ['Payments', 'Analytics'], true);
    await expect(dialog.getByText('What’s your budget?')).toBeVisible({ timeout: 20_000 });
    await media.pause(1500);
    await media.shot('ai-assistant', 'discovery-second-recommendation', { locator: dialog });
    await choose(page, ['$5k – $15k']);
    await choose(page, ['In 1–3 months']);

    // The brief.
    const brief = dialog.getByRole('region', { name: 'Your project brief' });
    await expect(brief).toBeVisible();
    await expect(dialog.getByRole('link', { name: /Copy brief and message me/ })).toBeVisible({ timeout: 45_000 });
    await media.pause(2000);
    await media.shot('ai-assistant', 'discovery-brief-ready', { locator: dialog });
    await brief.evaluate((element) => element.scrollIntoView({ block: 'end' }));
    await media.pause(800);

    await dialog.getByRole('button', { name: 'Copy only' }).click();
    await expect(dialog.getByText('Brief copied. Paste it into your message.')).toBeVisible();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard.startsWith('Project brief')).toBe(true);
    await media.pause(1000);
    await media.shot('ai-assistant', 'discovery-brief-copied', { locator: dialog });

    // Where the text came from: the AI stream, or the built-in fallback.
    // Compared without markdown marks and spacing, which the brief renders as elements.
    const plain = (text: string) => text.replace(/[#*\-–\s]+/g, ' ').trim().toLowerCase();
    const insightsShown = await dialog.locator('p.border-l-2').allInnerTexts();
    const briefShown = plain(await brief.innerText());
    const sources = (await readTappedStreams(page)).map((s) => ({
      kind: s.kind,
      status: s.status,
      tokenFrames: s.tokenFrames,
      sawDone: s.sawDone,
      errorFrame: s.errorFrame,
      firstChunkMs: s.firstChunkMs,
      totalMs: s.totalMs,
      answerStart: s.answer.slice(0, 120),
      shownOnScreen:
        s.answer.trim().length > 0 &&
        (s.kind === 'brief'
          ? briefShown.includes(plain(s.answer).slice(0, 80))
          : insightsShown.some((t) => plain(t).includes(plain(s.answer).slice(0, 60)))),
    }));
    diag.note('discoveryStreams', sources);
    diag.note('insightsShown', insightsShown);
    expect(sources.filter((s) => s.kind === 'insight')).toHaveLength(2);
    expect(sources.filter((s) => s.kind === 'brief')).toHaveLength(1);
    for (const s of sources) {
      expect(s.status, `${s.kind} HTTP status`).toBe(200);
      expect.soft(s.shownOnScreen, `${s.kind}: the AI's text is what the visitor sees (not the fallback)`).toBe(true);
    }

    // Progress survives a reload (localStorage), and "Start over" clears it.
    await page.reload();
    const reopened = await openAssistant(page);
    // The panel reopens on "Ask a question"; the saved brief is one tap away.
    await reopened.getByRole('button', { name: 'Plan a project' }).click();
    await expect(reopened.getByRole('region', { name: 'Your project brief' })).toBeVisible();
    await reopened.getByRole('button', { name: 'Start over' }).click();
    await expect(reopened.getByText('What are you building?')).toBeVisible();
    await media.pause(800);
  });

  test('changing an earlier answer re-asks the questions after it', async ({ page, media, diag }) => {
    // Not about the AI: its requests are refused so the steps are instant.
    diag.expect(/ai-chat\/discovery/, 'AI requests refused on purpose');
    await page.route(DISCOVERY, (route) => route.abort('connectionrefused'));
    await page.goto('/');
    const dialog = await openAssistant(page);
    await dialog.getByRole('button', { name: 'Plan a project' }).click();
    await choose(page, ['Online store']);
    await choose(page, ['It’s live']);
    // "It's live" adds the stack question.
    await expect(dialog.getByText('What is it built with?')).toBeVisible();
    await dialog.getByRole('button', { name: /You answered: Online store/ }).click();
    await expect(dialog.getByText('What are you building?')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Online store', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await media.shot('ai-assistant', 'discovery-editing-an-answer', { locator: dialog });
  });

  test('fallback: with the AI unreachable, built-in text keeps the flow going', async ({ page, media, diag }) => {
    diag.expect(/ai-chat\/discovery/, 'AI requests aborted on purpose');
    await page.route(DISCOVERY, (route) => route.abort('connectionrefused'));
    await page.goto('/');
    const dialog = await openAssistant(page);
    await dialog.getByRole('button', { name: 'Plan a project' }).click();
    await choose(page, ['SaaS platform']);
    await choose(page, ['Just an idea']);
    await expect(dialog.locator('p.border-l-2').first()).toBeVisible();
    for (const step of ['Skip', 'Skip', 'Skip', 'Skip', 'Skip', 'Skip', 'Skip']) {
      const skip = dialog.getByRole('button', { name: step, exact: true });
      if (!(await skip.isVisible()) || (await skip.isDisabled())) break;
      await skip.click();
      await page.waitForTimeout(200);
    }
    await expect(dialog.getByRole('region', { name: 'Your project brief' })).toBeVisible();
    await expect(dialog.getByRole('link', { name: /Copy brief and message me/ })).toBeVisible({ timeout: 20_000 });
    await media.shot('errors', 'discovery-brief-from-fallback-when-ai-unreachable', { locator: dialog });
  });
});
