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
  console.log(`\n🧪 Testing Label Bleeding Fix`);
  console.log(`URL: ${url}`);
  console.log(`Labeler: ${testLabelerId}\n`);

  try {
    // Load page
    console.log('Loading page...');
    await page.goto(url, { timeout: 60000, waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Wait for first domain button to appear (sign that page is loaded)
    await page.locator('button:has-text("APR")').first().waitFor({ state: 'visible', timeout: 30000 });
    console.log('✓ Page loaded\n');

    // Get initial task number from progress bar
    const progressText = await page.locator('text=/Task \\d+ of/').first().textContent();
    const task1Number = progressText?.match(/Task (\d+) of/)?.[1];
    console.log(`Task 1: #${task1Number}`);

    // Select APR domain
    console.log('Selecting APR domain...');
    const aprDomain = page.locator('button').filter({ hasText: /^APR$/ }).first();
    await aprDomain.click();
    await page.waitForTimeout(2500);

    // Verify APR is selected
    let aprClasses = await aprDomain.getAttribute('class');
    const aprSelected1 = aprClasses?.includes('border-blue-500');
    console.log(`✓ APR selected: ${aprSelected1}`);

    // Select first cluster
    console.log('Selecting cluster...');
    const cluster = page.locator('button').filter({ hasText: /APR\.[A-Z]/ }).first();
    await cluster.waitFor({ state: 'visible', timeout: 15000 });
    await cluster.click();
    await page.waitForTimeout(2000);
    console.log('✓ Cluster selected');

    // Select first standard
    console.log('Selecting standard...');
    const standard = page.locator('button').filter({ hasText: /APR\.[A-Z]\.\d+/ }).first();
    await standard.waitFor({ state: 'visible', timeout: 15000 });
    await standard.click();
    await page.waitForTimeout(1500);
    console.log('✓ Standard selected');

    // Submit
    console.log('\n📝 Submitting...');
    const submitButton = page.locator('button:has-text("Submit Label")');
    await submitButton.click();
    await page.waitForTimeout(5000);

    // Check we moved to next task
    const progressText2 = await page.locator('text=/Task \\d+ of/').first().textContent();
    const task2Number = progressText2?.match(/Task (\d+) of/)?.[1];

    if (task2Number === task1Number) {
      console.log('❌ Did not navigate to next task');
      process.exit(1);
    }

    console.log(`✓ Navigated to Task #${task2Number}\n`);

    // THE CRITICAL TEST: Check if selections from Task 1 are bleeding
    console.log('🔍 Checking for label bleeding...');
    await page.waitForTimeout(3000);

    const aprTask2 = page.locator('button').filter({ hasText: /^APR$/ }).first();
    const aprClassesTask2 = await aprTask2.getAttribute('class');
    const aprSelectedTask2 = aprClassesTask2?.includes('border-blue-500');

    console.log(`APR selected on Task 2: ${aprSelectedTask2}`);

    // Also check if clusters are visible (they shouldn't be for unlabeled task)
    const clusterCountTask2 = await page.locator('button').filter({ hasText: /APR\.[A-Z]/ }).count();
    console.log(`APR clusters visible on Task 2: ${clusterCountTask2}`);

    if (aprSelectedTask2) {
      console.log('\n❌ FAIL: Label bleeding detected!');
      console.log('APR domain from Task 1 is incorrectly showing as selected on Task 2');
      process.exit(1);
    }

    if (clusterCountTask2 > 0) {
      console.log('\n⚠️  WARNING: APR clusters are visible on Task 2');
      console.log('This might be expected if Task 2 was previously labeled with APR');
    }

    console.log('\n✅ SUCCESS: No label bleeding!');
    console.log('Task 2 is clean - no selections from Task 1\n');

    // Test backward navigation to verify persistence
    console.log('Testing backward navigation...');
    const prevButton = page.locator('button:has-text("Previous")').first();
    await prevButton.click();
    await page.waitForTimeout(3000);

    const progressText3 = await page.locator('text=/Task \\d+ of/').first().textContent();
    const task3Number = progressText3?.match(/Task (\d+) of/)?.[1];

    if (task3Number !== task1Number) {
      console.log(`❌ Expected Task #${task1Number}, got Task #${task3Number}`);
      process.exit(1);
    }

    console.log(`✓ Back on Task #${task3Number}`);

    // Check if Task 1's labels are still there
    await page.waitForTimeout(2000);
    const aprClassesBack = await aprDomain.getAttribute('class');
    const aprPersisted = aprClassesBack?.includes('border-blue-500');

    console.log(`APR still selected: ${aprPersisted}`);

    if (!aprPersisted) {
      console.log('\n❌ FAIL: Labels not persisting!');
      console.log('Task 1 labels disappeared after navigation');
      process.exit(1);
    }

    console.log('\n✅ SUCCESS: Labels persist correctly!\n');

    console.log('═══════════════════════════════════');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('═══════════════════════════════════');
    console.log('✓ No label bleeding to unlabeled tasks');
    console.log('✓ Labels persist on labeled tasks');
    console.log('✓ Navigation works properly');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
