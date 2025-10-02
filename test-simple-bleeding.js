const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testLabelerId = `test-bleeding-${Date.now()}`;
  await context.addInitScript((id) => {
    localStorage.setItem('labeler_id', id);
  }, testLabelerId);

  const url = 'https://mathebattle-labeling.vercel.app/label';
  console.log(`\n🧪 Testing Label Bleeding Fix`);
  console.log(`Labeler: ${testLabelerId}\n`);

  try {
    // Load page
    console.log('Loading page...');
    await page.goto(url, { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    console.log('✓ Page loaded');

    // Wait longer for React to hydrate
    await page.waitForTimeout(5000);

    // Find and click APR using more generous selector
    console.log('\nWaiting for domains to load...');
    await page.waitForSelector('button', { state: 'visible', timeout: 30000 });

    // Take screenshot to see what's there
    await page.screenshot({ path: 'test-before-click.png', fullPage: true });
    console.log('✓ Screenshot saved: test-before-click.png');

    // Get all buttons
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons on page`);

    // Find APR button by text content (starts with APR)
    let aprButton = null;
    for (const btn of buttons) {
      const text = await btn.textContent().catch(() => '');
      if (text.startsWith('APR') && text.includes('Polynomial')) {
        aprButton = btn;
        console.log('Found APR button!');
        break;
      }
    }

    if (!aprButton) {
      console.log('❌ Could not find APR button');
      // List first 20 button texts for debugging
      console.log('\nFirst 20 button texts:');
      for (let i = 0; i < Math.min(20, buttons.length); i++) {
        const text = await buttons[i].textContent().catch(() => 'ERROR');
        console.log(`  ${i}: "${text}"`);
      }
      process.exit(1);
    }

    // Click APR
    console.log('Clicking APR button...');
    await aprButton.click();
    await page.waitForTimeout(3000);
    console.log('✓ Clicked APR');

    //Take screenshot after click
    await page.screenshot({ path: 'test-after-apr-click.png', fullPage: true });
    console.log('✓ Screenshot saved: test-after-apr-click.png');

    // Find and click first cluster
    console.log('\nLooking for clusters...');
    const clusterButtons = await page.locator('button').all();
    let firstCluster = null;
    for (const btn of clusterButtons) {
      const text = await btn.textContent().catch(() => '');
      if (/^A-APR\.[A-Z]/.test(text.trim())) {
        firstCluster = btn;
        console.log(`Found cluster: ${text.trim()}`);
        break;
      }
    }

    if (!firstCluster) {
      console.log('❌ Could not find APR cluster button');
      process.exit(1);
    }

    await firstCluster.click();
    await page.waitForTimeout(2500);
    console.log('✓ Clicked cluster');

    // Find and click first standard
    console.log('\nLooking for standards...');
    const standardButtons = await page.locator('button').all();
    let firstStandard = null;
    for (const btn of standardButtons) {
      const text = await btn.textContent().catch(() => '');
      if (/^A-APR\.[A-Z]\.\d+/.test(text.trim())) {
        firstStandard = btn;
        console.log(`Found standard: ${text.trim()}`);
        break;
      }
    }

    if (!firstStandard) {
      console.log('❌ Could not find APR standard button');
      process.exit(1);
    }

    await firstStandard.click();
    await page.waitForTimeout(2000);
    console.log('✓ Clicked standard');

    // Submit
    console.log('\n📝 Submitting...');
    const submitBtn = page.locator('button:has-text("Submit Label")');
    await submitBtn.click();
    await page.waitForTimeout(6000);
    console.log('✓ Submitted');

    // Take screenshot of Task 2
    await page.screenshot({ path: 'test-task2.png', fullPage: true });
    console.log('✓ Screenshot saved: test-task2.png');

    // Check if APR is selected on new task
    console.log('\n🔍 Checking for label bleeding...');
    const allButtonsTask2 = await page.locator('button').all();
    let aprButtonTask2 = null;
    for (const btn of allButtonsTask2) {
      const text = await btn.textContent().catch(() => '');
      if (text.startsWith('APR') && text.includes('Polynomial')) {
        aprButtonTask2 = btn;
        break;
      }
    }

    if (aprButtonTask2) {
      const classes = await aprButtonTask2.getAttribute('class');
      const isSelected = classes?.includes('border-blue-500');
      console.log(`APR selected on Task 2: ${isSelected}`);

      if (isSelected) {
        console.log('\n❌ FAIL: Label bleeding detected!');
        console.log('Check test-task2.png to see the issue');
        process.exit(1);
      } else {
        console.log('\n✅ SUCCESS: No label bleeding!');
      }
    }

    // Keep browser open for inspection
    console.log('\nKeeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
    console.log('Error screenshot saved: test-error.png');
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
