const { chromium } = require('@playwright/test');

/**
 * Test for label "bleeding" bug
 *
 * Check if labels from one task incorrectly persist when navigating to a new unlabeled task
 */
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testLabelerId = `test-bleed-${Date.now()}`;
  await context.addInitScript((id) => {
    localStorage.setItem('labeler_id', id);
  }, testLabelerId);

  const url = process.env.DEPLOYMENT_URL || 'https://mathebattle-labeling.vercel.app/label';
  console.log(`\n🧪 Testing label bleeding bug: ${url}\n`);

  try {
    await page.goto(url, { timeout: 60000, waitUntil: 'networkidle' });
    console.log('✓ Page loaded');

    // Wait for task to load
    const taskHeader = page.locator('h2').filter({ hasText: /Task #\d+/ }).first();
    await taskHeader.waitFor({ state: 'visible', timeout: 45000 });
    const task1Text = await taskHeader.textContent();
    const task1Id = task1Text?.match(/Task #(\d+)/)?.[1];
    console.log(`Task 1 ID: ${task1Id}`);

    // Select APR domain
    console.log('Selecting APR domain on Task 1...');
    const aprDomain = page.locator('button').filter({ hasText: /^APR/ }).first();
    await aprDomain.click();
    await page.waitForTimeout(3000);  // Wait longer for React state to update

    // Check that APR is selected
    const aprClasses = await aprDomain.getAttribute('class');
    console.log(`APR domain classes after click: ${aprClasses}`);

    if (!aprClasses?.includes('border-blue-500')) {
      throw new Error('APR domain not selected on Task 1');
    }
    console.log('✓ APR domain selected on Task 1');

    // Select cluster
    const cluster = page.locator('button').filter({ hasText: /APR\.[A-Z]/ }).first();
    await cluster.waitFor({ state: 'visible', timeout: 15000 });
    await cluster.click();
    await page.waitForTimeout(2000);
    console.log('✓ APR cluster selected on Task 1');

    // Select standard
    const standard = page.locator('button').filter({ hasText: /APR\.[A-Z]\.\d+/ }).first();
    await standard.waitFor({ state: 'visible', timeout: 15000 });
    await standard.click();
    await page.waitForTimeout(1000);
    console.log('✓ APR standard selected on Task 1');

    // Submit
    const submitButton = page.locator('button:has-text("Submit Label")');
    await submitButton.click();
    await page.waitForTimeout(3000);
    console.log('✓ Submitted Task 1');

    // Check Task 2
    await taskHeader.waitFor({ state: 'visible', timeout: 45000 });
    const task2Text = await taskHeader.textContent();
    const task2Id = task2Text?.match(/Task #(\d+)/)?.[1];
    console.log(`\nNavigated to Task 2 ID: ${task2Id}`);

    if (task2Id === task1Id) {
      throw new Error('Did not navigate to Task 2');
    }

    // THE BUG CHECK: Are selections from Task 1 still showing?
    console.log('\nChecking if Task 1 selections incorrectly persist...');
    await page.waitForTimeout(2000);  // Wait for UI to stabilize

    const aprDomainTask2 = page.locator('button').filter({ hasText: /^APR/ }).first();
    const aprClassesTask2 = await aprDomainTask2.getAttribute('class');
    console.log(`APR domain classes on Task 2: ${aprClassesTask2}`);

    // Check if APR is still selected (BUG!)
    if (aprClassesTask2?.includes('border-blue-500')) {
      console.log('\n❌ BUG DETECTED: APR domain from Task 1 is still selected on unlabeled Task 2!');
      await page.screenshot({ path: 'label-bleeding-bug.png' });

      // Check if clusters are also showing
      const clusterVisible = await page.locator('button').filter({ hasText: /APR\.[A-Z]/ }).first().isVisible().catch(() => false);
      console.log(`APR clusters visible on Task 2: ${clusterVisible}`);

      if (clusterVisible) {
        console.log('❌ BUG: APR clusters from Task 1 are also showing on Task 2!');
      }

      process.exit(1);
    } else {
      console.log('✓ GOOD: APR domain not selected on fresh Task 2');
    }

    // Verify no clusters are visible (since no domain is selected yet)
    const clusterCount = await page.locator('button').filter({ hasText: /APR\.[A-Z]/ }).count();
    console.log(`APR cluster buttons visible on Task 2: ${clusterCount}`);

    if (clusterCount > 0) {
      const clusterVisible = await page.locator('button').filter({ hasText: /APR\.[A-Z]/ }).first().isVisible();
      if (clusterVisible) {
        console.log('\n❌ BUG DETECTED: APR clusters are visible without domain selection!');
        await page.screenshot({ path: 'label-bleeding-clusters.png' });
        process.exit(1);
      }
    }

    console.log('✓ GOOD: No APR clusters showing on fresh Task 2\n');
    console.log('✅ No label bleeding detected!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'label-bleeding-error.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
