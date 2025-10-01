const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testLabelerId = `test-local-${Date.now()}`;
  await context.addInitScript((id) => {
    localStorage.setItem('labeler_id', id);
  }, testLabelerId);

  const url = 'http://localhost:3002/label';
  console.log(`\n🧪 Testing locally: ${url}`);
  console.log(`Labeler ID: ${testLabelerId}\n`);

  try {
    await page.goto(url, { timeout: 60000, waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Select domain, cluster, standard
    await page.locator('button').filter({ hasText: /^APR/ }).first().click();
    await page.waitForTimeout(1500);

    await page.locator('button').filter({ hasText: /A-APR\.[A-Z]/ }).first().click();
    await page.waitForTimeout(2000);

    await page.locator('button').filter({ hasText: /A-APR\.A\.\d+/ }).first().click();
    await page.waitForTimeout(1000);

    console.log('✓ Made selections');

    // Get first task ID
    const taskHeader = await page.locator('h2').filter({ hasText: /Task #\d+/ }).first();
    const firstTaskText = await taskHeader.textContent();
    const firstTaskId = firstTaskText?.match(/Task #(\d+)/)?.[1];
    console.log(`✓ First task ID: ${firstTaskId}`);

    // Submit
    await page.locator('button:has-text("Submit Label")').click();
    await page.waitForTimeout(5000);
    console.log('✓ Submitted label');

    // Get new task ID
    const newTaskHeader = await page.locator('h2').filter({ hasText: /Task #\d+/ }).first();
    const newTaskText = await newTaskHeader.textContent();
    const secondTaskId = newTaskText?.match(/Task #(\d+)/)?.[1];
    console.log(`✓ Navigated to task ID: ${secondTaskId}`);

    if (secondTaskId === firstTaskId) {
      throw new Error('Did not navigate to next task');
    }

    // Navigate back
    await page.locator('button:has-text("Previous")').first().click();
    await page.waitForTimeout(3000);
    console.log('✓ Navigated back');

    // Verify we're on first task
    const returnedTaskHeader = await page.locator('h2').filter({ hasText: /Task #\d+/ }).first();
    const returnedTaskText = await returnedTaskHeader.textContent();
    const returnedTaskId = returnedTaskText?.match(/Task #(\d+)/)?.[1];
    console.log(`✓ Returned to task ID: ${returnedTaskId}`);

    if (returnedTaskId !== firstTaskId) {
      throw new Error(`Expected task ${firstTaskId}, got ${returnedTaskId}`);
    }

    // Check for labeled banner
    const labeledBanner = page.locator('text=This task has already been labeled');
    const bannerVisible = await labeledBanner.isVisible({ timeout: 5000 });

    if (!bannerVisible) {
      console.error('\n❌ FAIL: Labeled banner not visible');
      await page.screenshot({ path: 'local-persistence-fail.png' });
      throw new Error('Label persistence failed - banner not visible');
    }
    console.log('✓ Labeled banner visible');

    // Check domain selection preserved
    const selectedDomain = page.locator('button').filter({ hasText: /^APR/ }).first();
    const domainClasses = await selectedDomain.getAttribute('class');

    if (!domainClasses?.includes('border-blue-500') || !domainClasses?.includes('bg-blue-50')) {
      console.error('\n❌ FAIL: Domain selection not preserved');
      console.error('Domain classes:', domainClasses);
      throw new Error('Label persistence failed - domain not selected');
    }
    console.log('✓ Domain selection preserved');

    console.log('\n✅ All local persistence tests passed!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'local-test-error.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
