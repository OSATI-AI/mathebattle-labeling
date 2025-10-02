const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testLabelerId = `test-bleeding-${Date.now()}`;
  await context.addInitScript((id) => {
    localStorage.setItem('labeler_id', id);
  }, testLabelerId);

  const url = 'https://mathebattle-labeling.vercel.app/label';
  console.log(`\n🧪 Testing label bleeding fix: ${url}`);
  console.log(`Labeler ID: ${testLabelerId}\n`);

  try {
    await page.goto(url, { timeout: 60000, waitUntil: 'networkidle' });

    // Wait for first task
    const taskHeader = page.locator('h2').filter({ hasText: /Task #\d+/ }).first();
    await taskHeader.waitFor({ state: 'visible', timeout: 30000 });
    const task1Text = await taskHeader.textContent();
    const task1Id = task1Text?.match(/Task #(\d+)/)?.[1];
    console.log(`✓ Loaded Task #${task1Id}`);

    // Select APR domain on Task 1
    console.log('\n📝 Selecting APR domain on Task 1...');
    const aprDomain = page.locator('button').filter({ hasText: /^APR$/ }).first();
    await aprDomain.click();
    await page.waitForTimeout(2000);

    // Verify APR is selected
    let aprClasses = await aprDomain.getAttribute('class');
    console.log(`APR selected on Task 1: ${aprClasses?.includes('border-blue-500')}`);

    // Select cluster
    const cluster = page.locator('button').filter({ hasText: /APR\.[A-Z]/ }).first();
    await cluster.waitFor({ state: 'visible', timeout: 15000 });
    const clusterText = await cluster.textContent();
    console.log(`Selecting cluster: ${clusterText}`);
    await cluster.click();
    await page.waitForTimeout(2000);

    // Select standard
    const standard = page.locator('button').filter({ hasText: /APR\.[A-Z]\.\d+/ }).first();
    await standard.waitFor({ state: 'visible', timeout: 15000 });
    const standardText = await standard.textContent();
    console.log(`Selecting standard: ${standardText}`);
    await standard.click();
    await page.waitForTimeout(1500);

    // Submit
    console.log('\n💾 Submitting Task 1...');
    const submitButton = page.locator('button:has-text("Submit Label")');
    await submitButton.click();

    // Wait for navigation to Task 2
    await page.waitForTimeout(3000);

    const task2Text = await taskHeader.textContent();
    const task2Id = task2Text?.match(/Task #(\d+)/)?.[1];

    if (task2Id === task1Id) {
      console.log('❌ Failed to navigate to next task');
      process.exit(1);
    }

    console.log(`✓ Navigated to Task #${task2Id}\n`);

    // THE CRITICAL TEST: Check if Task 1's selections are bleeding into Task 2
    console.log('🔍 Checking for label bleeding...');
    await page.waitForTimeout(2000);

    const aprDomainTask2 = page.locator('button').filter({ hasText: /^APR$/ }).first();
    const aprClassesTask2 = await aprDomainTask2.getAttribute('class');
    const aprSelectedOnTask2 = aprClassesTask2?.includes('border-blue-500');

    const clusterCountTask2 = await page.locator('button').filter({ hasText: /APR\.[A-Z]/ }).count();

    console.log(`APR domain selected on Task 2: ${aprSelectedOnTask2}`);
    console.log(`APR clusters visible on Task 2: ${clusterCountTask2}`);

    if (aprSelectedOnTask2) {
      console.log('\n❌ FAIL: Label bleeding detected! APR domain from Task 1 is selected on unlabeled Task 2');
      process.exit(1);
    }

    if (clusterCountTask2 > 0) {
      console.log('\n❌ FAIL: Label bleeding detected! APR clusters from Task 1 are visible on unlabeled Task 2');
      process.exit(1);
    }

    console.log('\n✅ PASS: No label bleeding detected!');
    console.log('Task 2 is clean - no selections from Task 1');

    // Now navigate back to Task 1 to verify labels persist
    console.log('\n⬅️  Navigating back to Task 1 to verify persistence...');
    const prevButton = page.locator('button:has-text("Previous")').first();
    await prevButton.click();
    await page.waitForTimeout(2000);

    const task1AgainText = await taskHeader.textContent();
    const task1AgainId = task1AgainText?.match(/Task #(\d+)/)?.[1];

    if (task1AgainId !== task1Id) {
      console.log(`❌ FAIL: Expected Task #${task1Id}, got Task #${task1AgainId}`);
      process.exit(1);
    }

    console.log(`✓ Back on Task #${task1AgainId}`);

    // Check if Task 1's labels are still there
    await page.waitForTimeout(2000);
    const aprClassesBack = await aprDomain.getAttribute('class');
    const aprSelectedBack = aprClassesBack?.includes('border-blue-500');

    console.log(`APR domain selected on Task 1 (revisited): ${aprSelectedBack}`);

    if (!aprSelectedBack) {
      console.log('\n❌ FAIL: Labels not persisted! Task 1 labels disappeared');
      process.exit(1);
    }

    console.log('\n✅ PASS: Labels persisted correctly!');
    console.log('Task 1 still shows the submitted labels');

    console.log('\n\n🎉 ALL TESTS PASSED!');
    console.log('✓ No label bleeding to unlabeled tasks');
    console.log('✓ Labels persist on labeled tasks');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
