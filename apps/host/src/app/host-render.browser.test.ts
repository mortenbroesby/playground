import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromium, type Browser, type Page } from 'playwright';

const baseUrl = 'http://127.0.0.1:3000';

let browser: Browser | undefined;
let page: Page | undefined;

describe('host rendering', () => {
  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (page) {
      await page.close();
    }

    if (browser) {
      await browser.close();
    }
  });

  it('renders orchestrator shell and recovers when remotes are unavailable', async () => {
    if (!page) {
      throw new Error('Browser page was not initialized.');
    }

    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: 'Next.js Orchestrator Shell' })).resolves.toBeTruthy();
    await expect(page.getByRole('heading', { name: 'Micro frontend todo dashboard' })).resolves.toBeTruthy();

    await page.waitForTimeout(750);

    const errors = page.getByText('Micro frontend unavailable');
    await expect(errors.count()).resolves.toBeGreaterThan(0);
  });
});
