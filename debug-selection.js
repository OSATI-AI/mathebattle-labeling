const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  await context.addInitScript(() => {
    localStorage.setItem('labeler_id', `debug-sel-${Date.now()}`);
  });

  const url = 'https://mathebattle-labeling.vercel.app/label';
  console.log(`Navigating to: ${url}`);

  try {
    await page.goto(url, { timeout: 60000, waitUntil: 'networkidle' });

    // Wait for task to load
    const taskHeader = page.locator('h2').filter({ hasText: /Task #\d+/ }).first();
    await taskHeader.waitFor({ state: 'visible', timeout: 45000 });

    console.log('Task loaded, clicking APR domain...');

    // Click APR
    const aprDomain = page.locator('button').filter({ hasText: /^APR/ }).first();
    console.log('Found APR button, clicking...');
    await aprDomain.click();

    console.log('Clicked, waiting 5 seconds...');
    await page.waitForTimeout(5000);

    const aprClasses = await aprDomain.getAttribute('class');
    console.log('APR classes:', aprClasses);

    console.log('Press Ctrl+C to close browser...');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
