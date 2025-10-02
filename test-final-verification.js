const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testLabelerId = `test-final-${Date.now()}`;
  await context.addInitScript((id) => {
    localStorage.setItem('labeler_id', id);
  }, testLabelerId);

  const url = 'https://mathebattle-labeling.vercel.app/label';
  console.log(`\n🧪 Final Verification Test: ${url}`);
  console.log(`Labeler ID: ${testLabelerId}\n`);

  try {
    console.log('Loading page...');
    await page.goto(url, { timeout: 60000, waitUntil: 'networkidle' });
    console.log('✓ Page loaded');

    // Wait for content
    await page.waitForTimeout(5000);

    // Check if tasks are loading
    const bodyText = await page.textContent('body');

    if (bodyText.includes('No Tasks Available')) {
      console.log('❌ No tasks available');
      process.exit(1);
    }

    // Find task header with more flexible selector
    const taskHeader = await page.locator('h2, h3').filter({ hasText: /Task #\d+/ }).first();
    await taskHeader.waitFor({ state: 'visible', timeout: 10000 });

    const task1Text = await taskHeader.textContent();
    const task1Id = task1Text?.match(/Task #(\d+)/)?.[1];
    console.log(`✓ Loaded Task #${task1Id}\n`);

    // Select APR domain
    console.log('Selecting APR domain...');
    const aprDomain = page.locator('button:has-text("APR")').first();
    await aprDomain.waitFor({ state: 'visible', timeout: 10000 });
    await aprDomain.click();
    await page.waitForTimeout(2500);

    const aprSelected = (await aprDomain.getAttribute('class'))?.includes('border-blue-500');
    console.log(`✓ APR selected: ${aprSelected}`);

    // Select cluster
    console.log('Selecting cluster...');
    const cluster = page.locator('button').filter({ hasText: /APR\.[A-Z]/ }).first();
    await cluster.waitFor({ state: 'visible', timeout: 10000 });
    await cluster.click();
    await page.waitForTimeout(2000);
    console.log('✓ Cluster selected');

    // Select standard
    console.log('Selecting standard...');
    const standard = page.locator('button').filter({ hasText: /APR\.[A-Z]\.\d+/ }).first();
    await standard.waitFor({ state: 'visible', timeout: 10000 });
    await standard.click();
    await page.waitForTimeout(1500);
    console.log('✓ Standard selected');

    // Submit
    console.log('\nSubmitting label...');
    const submitButton = page.locator('button:has-text("Submit Label")');
    await submitButton.click();
    console.log('✓ Submitted');

    // Wait for navigation
    console.log('Waiting for navigation...');
    await page.waitForTimeout(5000);

    const task2Text = await taskHeader.textContent();
    const task2Id = task2Text?.match(/Task #(\d+)/)?.[1];

    if (task2Id === task1Id) {
      console.log('❌ Did not navigate to next task');
      process.exit(1);
    }

    console.log(`✓ Navigated to Task #${task2Id}\n`);

    // THE CRITICAL CHECK
    console.log('🔍 Checking for label bleeding...');
    await page.waitForTimeout(3000);

    const aprTask2 = page.locator('button:has-text("APR")').first();
    const aprClassesTask2 = await aprTask2.getAttribute('class');
    const aprSelectedTask2 = aprClassesTask2?.includes('border-blue-500');

    console.log(`APR selected on Task 2: ${aprSelectedTask2}`);

    if (aprSelectedTask2) {
      console.log('\n❌ FAIL: Label bleeding bug still exists!');
      console.log('Task 1 selections are showing on Task 2');
      process.exit(1);
    }

    console.log('\n✅ SUCCESS: No label bleeding!');
    console.log('Task 2 is clean\n');

    // Test backward navigation
    console.log('Testing backward navigation...');
    const prevButton = page.locator('button:has-text("Previous")').first();
    await prevButton.click();
    await page.waitForTimeout(3000);

    const backTaskText = await taskHeader.textContent();
    const backTaskId = backTaskText?.match(/Task #(\d+)/)?.[1];

    if (backTaskId !== task1Id) {
      console.log(`❌ Expected Task #${task1Id}, got Task #${backTaskId}`);
      process.exit(1);
    }

    console.log(`✓ Back on Task #${task1Id}`);

    // Check persistence
    await page.waitForTimeout(2000);
    const aprBackClasses = await aprDomain.getAttribute('class');
    const aprPersisted = aprBackClasses?.includes('border-blue-500');

    console.log(`APR still selected: ${aprPersisted}`);

    if (!aprPersisted) {
      console.log('\n❌ FAIL: Labels not persisting!');
      process.exit(1);
    }

    console.log('\n✅ SUCCESS: Labels persist correctly!\n');
    console.log('═══════════════════════════════════');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('═══════════════════════════════════');
    console.log('✓ No label bleeding');
    console.log('✓ Labels persist correctly');
    console.log('✓ Navigation works properly');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
