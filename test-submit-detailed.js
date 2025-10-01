const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testLabelerId = `test-submit-${Date.now()}`;

  // Capture ALL console messages
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
  });

  // Capture page errors
  page.on('pageerror', err => {
    console.log('[PAGE ERROR]:', err.message);
  });

  // Track all network requests
  const apiRequests = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      apiRequests.push({
        type: 'REQUEST',
        method: request.method(),
        url: request.url(),
        postData: request.postData(),
      });
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      let body = '';
      try {
        body = await response.text();
      } catch (e) {}
      apiRequests.push({
        type: 'RESPONSE',
        method: response.request().method(),
        url: response.url(),
        status: response.status(),
        body: body.substring(0, 200),
      });
    }
  });

  await context.addInitScript((id) => {
    localStorage.setItem('labeler_id', id);
  }, testLabelerId);

  const url = process.env.DEPLOYMENT_URL || 'https://mathebattle-labeling.vercel.app/label';
  console.log(`\n🧪 Testing submission on: ${url}`);
  console.log(`Labeler ID: ${testLabelerId}\n`);

  try {
    await page.goto(url, { timeout: 60000, waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Check if submit button exists and is initially disabled
    const submitButton = page.locator('button:has-text("Submit Label")');
    const exists = await submitButton.count();
    console.log(`Submit button exists: ${exists > 0}`);

    if (exists > 0) {
      const initiallyDisabled = await submitButton.isDisabled();
      console.log(`Submit button initially disabled: ${initiallyDisabled}\n`);
    }

    // Select domain
    console.log('Selecting domain...');
    await page.locator('button').filter({ hasText: /^APR/ }).first().click();
    await page.waitForTimeout(1500);

    // Select cluster
    console.log('Selecting cluster...');
    await page.waitForSelector('text=2. Select Cluster', { timeout: 10000 });
    await page.locator('button').filter({ hasText: /A-APR\.[A-Z]/ }).first().click();
    await page.waitForTimeout(2000);

    // Select standard
    console.log('Selecting standard...');
    await page.waitForSelector('text=3. Select Standard', { timeout: 10000 });
    await page.waitForTimeout(2000);
    const standardButton = page.locator('button').filter({ hasText: /A-APR\.A\.\d+/ }).first();
    const standardVisible = await standardButton.isVisible();
    console.log(`Standard button visible: ${standardVisible}`);

    if (standardVisible) {
      await standardButton.click();
      await page.waitForTimeout(1000);
      console.log('Standard selected\n');
    }

    // Check submit button state
    const nowEnabled = await submitButton.isEnabled();
    console.log(`Submit button now enabled: ${nowEnabled}\n`);

    if (!nowEnabled) {
      console.error('❌ Submit button is still disabled!');
      await page.screenshot({ path: 'submit-disabled.png' });
      throw new Error('Submit button not enabled after selections');
    }

    // Click submit
    console.log('Clicking submit button...');
    await submitButton.click();
    console.log('Submit clicked\n');

    // Wait longer for the POST request
    console.log('Waiting 10 seconds for POST request...');
    await page.waitForTimeout(10000);

    console.log('\n=== API REQUESTS ===\n');
    if (apiRequests.length === 0) {
      console.log('⚠️  NO API REQUESTS CAPTURED');
    } else {
      apiRequests.forEach(req => {
        console.log(`${req.type}: ${req.method} ${req.url}`);
        if (req.type === 'REQUEST' && req.postData) {
          console.log(`  POST DATA: ${req.postData.substring(0, 200)}`);
        }
        if (req.type === 'RESPONSE') {
          console.log(`  STATUS: ${req.status}`);
          console.log(`  BODY: ${req.body}`);
        }
        console.log('');
      });
    }

    // Check specifically for POST to /api/labels
    const postRequests = apiRequests.filter(r => r.method === 'POST' && r.url.includes('/api/labels'));
    if (postRequests.length === 0) {
      console.error('\n❌ NO POST REQUEST TO /api/labels WAS MADE\n');
      console.error('This means the submit handler either:');
      console.error('1. Did not execute');
      console.error('2. Failed validation silently');
      console.error('3. Threw an error before making the request\n');
    } else {
      console.log('\n✅ POST request was made');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'submit-test-error.png' });
  } finally {
    await browser.close();
  }
})();
