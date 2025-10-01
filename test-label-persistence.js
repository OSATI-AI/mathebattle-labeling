const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Set unique labeler ID for this test
  const testLabelerId = `test-persist-${Date.now()}`;
  await context.addInitScript((id) => {
    localStorage.setItem('labeler_id', id);
  }, testLabelerId);

  const url = process.env.DEPLOYMENT_URL || 'https://mathebattle-labeling.vercel.app/label';
  console.log(`\n🧪 Testing label persistence on: ${url}\n`);

  try {
    // Step 1: Navigate to page
    await page.goto(url, { timeout: 60000, waitUntil: 'networkidle' });
    console.log('✓ Page loaded');

    // Wait for React to hydrate
    await page.waitForTimeout(3000);

    // Step 2: Get first task ID
    const taskHeader = await page.locator('h2').filter({ hasText: /Task #\d+/ }).first();
    const visible = await taskHeader.isVisible();
    if (!visible) {
      throw new Error('Task header not visible');
    }
    const firstTaskText = await taskHeader.textContent();
    const firstTaskId = firstTaskText?.match(/Task #(\d+)/)?.[1];
    console.log(`✓ First task ID: ${firstTaskId}`);

    // Step 3: Select domain
    const aprDomain = page.locator('button').filter({ hasText: /^APR/ }).first();
    await aprDomain.click();
    await page.waitForTimeout(1000);
    console.log('✓ Selected APR domain');

    // Step 4: Select cluster
    await page.waitForSelector('text=2. Select Cluster', { timeout: 10000 });
    const firstCluster = page.locator('button').filter({ hasText: /A-APR\.[A-Z]/ }).first();
    const clusterVisible = await firstCluster.isVisible({ timeout: 10000 });
    if (!clusterVisible) {
      throw new Error('Cluster not visible');
    }
    await firstCluster.click();
    const clusterText = await firstCluster.textContent();
    const clusterId = clusterText?.split('\n')[0].trim();
    console.log(`✓ Selected cluster: ${clusterId}`);
    await page.waitForTimeout(1000);

    // Step 5: Select standard
    await page.waitForSelector('text=3. Select Standard', { timeout: 10000 });
    await page.waitForTimeout(2000);
    const firstStandardButton = page.locator('button').filter({ hasText: /A-APR\.A\.\d+/ }).first();
    const standardVisible = await firstStandardButton.isVisible({ timeout: 10000 });
    if (!standardVisible) {
      throw new Error('Standard not visible');
    }
    await firstStandardButton.click();
    await page.waitForTimeout(1000);
    console.log('✓ Selected standard');

    // Step 6: Submit
    const submitButton = page.locator('button:has-text("Submit Label")');
    const enabled = await submitButton.isEnabled();
    if (!enabled) {
      throw new Error('Submit button not enabled');
    }
    await submitButton.click();
    console.log('✓ Clicked submit button');

    // Wait for navigation to next task
    await page.waitForTimeout(3000);
    const newTaskHeader = await page.locator('h2').filter({ hasText: /Task #\d+/ }).first();
    const newTaskText = await newTaskHeader.textContent();
    const secondTaskId = newTaskText?.match(/Task #(\d+)/)?.[1];
    console.log(`✓ Navigated to task ID: ${secondTaskId}`);

    if (secondTaskId === firstTaskId) {
      throw new Error('Did not navigate to next task');
    }

    // Step 7: Navigate back
    const previousButton = page.locator('button:has-text("Previous")').first();
    await previousButton.click();
    await page.waitForTimeout(3000);
    console.log('✓ Clicked previous button');

    // Step 8: Verify we're back on first task
    const returnedTaskHeader = await page.locator('h2').filter({ hasText: /Task #\d+/ }).first();
    const returnedTaskText = await returnedTaskHeader.textContent();
    const returnedTaskId = returnedTaskText?.match(/Task #(\d+)/)?.[1];
    console.log(`✓ Returned to task ID: ${returnedTaskId}`);

    if (returnedTaskId !== firstTaskId) {
      throw new Error(`Expected task ${firstTaskId}, got ${returnedTaskId}`);
    }

    // Step 9: Verify labeled banner appears
    const labeledBanner = page.locator('text=This task has already been labeled');
    const bannerVisible = await labeledBanner.isVisible({ timeout: 5000 });

    if (!bannerVisible) {
      console.error('❌ FAIL: Labeled banner not visible');
      await page.screenshot({ path: 'label-persistence-fail.png' });
      throw new Error('Label persistence failed - banner not visible');
    }
    console.log('✓ Labeled banner visible');

    // Step 10: Verify selections are preserved
    const selectedDomain = page.locator('button').filter({ hasText: /^APR/ }).first();
    const domainClasses = await selectedDomain.getAttribute('class');

    if (!domainClasses?.includes('border-blue-500') || !domainClasses?.includes('bg-blue-50')) {
      console.error('❌ FAIL: Domain selection not preserved');
      console.error('Domain classes:', domainClasses);
      throw new Error('Label persistence failed - domain not selected');
    }
    console.log('✓ Domain selection preserved');

    console.log('\n✅ All label persistence tests passed!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'label-persistence-error.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
