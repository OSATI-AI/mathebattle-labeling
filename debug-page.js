const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Set labeler ID
  await context.addInitScript(() => {
    localStorage.setItem('labeler_id', `debug-${Date.now()}`);
  });

  const url = 'https://mathebattle-labeling-kfbpahlrk-wielands-projects-edb6f5fe.vercel.app/label';
  console.log(`Navigating to: ${url}`);

  try {
    await page.goto(url, { timeout: 60000 });
    console.log('Page loaded');

    // Wait a bit for React to hydrate
    await page.waitForTimeout(3000);

    // Check page title
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Check for main heading
    const heading = await page.locator('text=Mathebattle Labeling Interface').first();
    const headingVisible = await heading.isVisible().catch(() => false);
    console.log(`Main heading visible: ${headingVisible}`);

    // Check for task header
    const taskHeader = await page.locator('h2').filter({ hasText: /Task #/ }).first();
    const taskHeaderVisible = await taskHeader.isVisible().catch(() => false);
    console.log(`Task header visible: ${taskHeaderVisible}`);

    if (taskHeaderVisible) {
      const taskText = await taskHeader.textContent();
      console.log(`Task header text: ${taskText}`);
    }

    // Check for domain selector
    const domainHeading = await page.locator('text=1. Select Domain').first();
    const domainVisible = await domainHeading.isVisible().catch(() => false);
    console.log(`Domain selector visible: ${domainVisible}`);

    // Check for any errors in console
    page.on('console', msg => console.log(`Browser console [${msg.type()}]:`, msg.text()));
    page.on('pageerror', err => console.log('Browser error:', err.message));

    // Take a screenshot
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    console.log('Screenshot saved to debug-screenshot.png');

    // Get page content snippet
    const bodyText = await page.evaluate(() => {
      return document.body.innerText.substring(0, 500);
    });
    console.log('\nPage content (first 500 chars):\n', bodyText);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
