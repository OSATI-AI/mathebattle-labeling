const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await context.addInitScript(() => {
    localStorage.setItem('labeler_id', `test-quick-${Date.now()}`);
  });

  const url = 'https://mathebattle-labeling.vercel.app/label';
  console.log(`\n🔍 Quick check: ${url}\n`);

  try {
    console.log('Loading page...');
    await page.goto(url, { timeout: 30000, waitUntil: 'domcontentloaded' });

    await page.waitForTimeout(5000);

    // Check what's on the page
    const bodyText = await page.textContent('body');

    if (bodyText.includes('No Tasks Available')) {
      console.log('❌ Page shows: No Tasks Available');

      // Check console errors
      const logs = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          logs.push(msg.text());
        }
      });

      await page.reload();
      await page.waitForTimeout(3000);

      console.log('\nConsole errors:', logs);
    } else if (bodyText.includes('Task #')) {
      console.log('✅ Page loaded successfully with tasks');
      const taskMatch = bodyText.match(/Task #(\d+)/);
      console.log('First task:', taskMatch ? taskMatch[1] : 'unknown');
    } else {
      console.log('❓ Unexpected page state');
      console.log('Body preview:', bodyText.substring(0, 200));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
