const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testLabelerId = `test-api-${Date.now()}`;

  // Capture console and network
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  const networkRequests = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/labels')) {
      networkRequests.push({
        type: 'request',
        method: request.method(),
        url: url,
      });
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/labels')) {
      const status = response.status();
      let body = null;
      try {
        body = await response.text();
      } catch (e) {
        body = 'Could not read body';
      }
      networkRequests.push({
        type: 'response',
        method: response.request().method(),
        url: url,
        status: status,
        body: body,
      });
    }
  });

  await context.addInitScript((id) => {
    localStorage.setItem('labeler_id', id);
  }, testLabelerId);

  const url = 'https://mathebattle-labeling-kfbpahlrk-wielands-projects-edb6f5fe.vercel.app/label';
  console.log(`\n🧪 Testing API directly on: ${url}\n`);
  console.log(`Labeler ID: ${testLabelerId}\n`);

  try {
    await page.goto(url, { timeout: 60000, waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    console.log('✓ Page loaded\n');

    // Select domain, cluster, standard
    await page.locator('button').filter({ hasText: /^APR/ }).first().click();
    await page.waitForTimeout(1000);

    await page.locator('button').filter({ hasText: /A-APR\.[A-Z]/ }).first().click();
    await page.waitForTimeout(2000);

    await page.locator('button').filter({ hasText: /A-APR\.A\.\d+/ }).first().click();
    await page.waitForTimeout(1000);

    console.log('✓ Made selections\n');

    // Submit
    await page.locator('button:has-text("Submit Label")').click();
    console.log('✓ Clicked submit\n');

    // Wait for submission to complete
    await page.waitForTimeout(5000);

    console.log('\n=== NETWORK REQUESTS ===\n');
    networkRequests.forEach(req => {
      if (req.type === 'request') {
        console.log(`➡️  ${req.method} ${req.url}`);
      } else {
        console.log(`⬅️  ${req.method} ${req.url}`);
        console.log(`   Status: ${req.status}`);
        console.log(`   Body: ${req.body}`);
        console.log('');
      }
    });

    console.log('\n=== CONSOLE MESSAGES ===\n');
    consoleMessages.forEach(msg => {
      if (msg.text.includes('label') || msg.text.includes('error') || msg.text.includes('fetch')) {
        console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
      }
    });

    // Now manually query the API
    console.log('\n=== MANUAL API QUERY ===\n');
    const apiUrl = `https://mathebattle-labeling-kfbpahlrk-wielands-projects-edb6f5fe.vercel.app/api/labels?labeler_id=${testLabelerId}`;
    console.log(`Querying: ${apiUrl}\n`);

    const response = await page.evaluate(async (url) => {
      const resp = await fetch(url);
      return {
        status: resp.status,
        body: await resp.text()
      };
    }, apiUrl);

    console.log(`Status: ${response.status}`);
    console.log(`Body: ${response.body}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();
