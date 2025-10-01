const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture all console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleMessages.push({ type, text });
    console.log(`[CONSOLE ${type.toUpperCase()}]:`, text);
  });

  // Capture all page errors
  const pageErrors = [];
  page.on('pageerror', err => {
    pageErrors.push(err.message);
    console.log('[PAGE ERROR]:', err.message);
    console.log('[STACK]:', err.stack);
  });

  // Set labeler ID
  await context.addInitScript(() => {
    localStorage.setItem('labeler_id', `debug-${Date.now()}`);
  });

  const url = 'https://mathebattle-labeling-kfbpahlrk-wielands-projects-edb6f5fe.vercel.app/label';
  console.log(`\nNavigating to: ${url}\n`);

  try {
    await page.goto(url, { timeout: 60000, waitUntil: 'networkidle' });
    console.log('\n✅ Page loaded\n');

    // Wait for any lazy loading
    await page.waitForTimeout(5000);

    // Get HTML to see what actually loaded
    const html = await page.content();
    console.log('\n=== HTML CONTENT (first 2000 chars) ===\n');
    console.log(html.substring(0, 2000));

    // Check for React root
    const reactRoot = await page.evaluate(() => {
      const root = document.getElementById('__next');
      return {
        exists: !!root,
        innerHTML: root ? root.innerHTML.substring(0, 500) : null
      };
    });
    console.log('\n=== React Root (#__next) ===');
    console.log('Exists:', reactRoot.exists);
    console.log('Content:', reactRoot.innerHTML);

    console.log('\n=== Summary ===');
    console.log(`Console messages: ${consoleMessages.length}`);
    console.log(`Page errors: ${pageErrors.length}`);

    if (pageErrors.length > 0) {
      console.log('\n=== ALL PAGE ERRORS ===');
      pageErrors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
