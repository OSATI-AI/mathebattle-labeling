const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await context.addInitScript(() => {
    localStorage.setItem('labeler_id', `test-inspect-${Date.now()}`);
  });

  const url = 'https://mathebattle-labeling.vercel.app/label';
  console.log(`\n🔍 Inspecting state transitions: ${url}\n`);

  try {
    await page.goto(url, { timeout: 60000, waitUntil: 'networkidle' });

    // Wait for Task 1
    const taskHeader = page.locator('h2').filter({ hasText: /Task #\d+/ }).first();
    await taskHeader.waitFor({ state: 'visible', timeout: 45000 });
    const task1Text = await taskHeader.textContent();
    const task1Id = task1Text?.match(/Task #(\d+)/)?.[1];
    console.log(`Task 1 ID: ${task1Id}`);

    // Select and submit
    console.log('Selecting APR domain...');
    const aprDomain = page.locator('button').filter({ hasText: /^APR/ }).first();
    await aprDomain.click();
    await page.waitForTimeout(2500);

    const cluster = page.locator('button').filter({ hasText: /APR\.[A-Z]/ }).first();
    await cluster.waitFor({ state: 'visible', timeout: 15000 });
    await cluster.click();
    await page.waitForTimeout(2000);

    const standard = page.locator('button').filter({ hasText: /APR\.[A-Z]\.\d+/ }).first();
    await standard.waitFor({ state: 'visible', timeout: 15000 });
    await standard.click();
    await page.waitForTimeout(1500);

    console.log('Submitting...');
    const submitButton = page.locator('button:has-text("Submit Label")');
    await submitButton.click();

    console.log('\n=== INSPECTING STATE AFTER SUBMIT ===');

    // Check state at different intervals
    for (let i = 1; i <= 10; i++) {
      await page.waitForTimeout(1000);

      const currentTaskText = await taskHeader.textContent().catch(() => 'ERROR');
      const currentTaskId = currentTaskText?.match(/Task #(\d+)/)?.[1];

      const aprClasses = await aprDomain.getAttribute('class').catch(() => 'ERROR');
      const isSelected = aprClasses?.includes('border-blue-500');

      const clusterCount = await page.locator('button').filter({ hasText: /APR\.[A-Z]/ }).count();

      console.log(`[${i}s] Task: ${currentTaskId} | APR selected: ${isSelected} | Clusters visible: ${clusterCount}`);

      if (currentTaskId !== task1Id) {
        console.log(`\n✓ Navigated to Task ${currentTaskId} at ${i} seconds`);

        // Wait a bit more and check final state
        await page.waitForTimeout(2000);
        const finalClasses = await aprDomain.getAttribute('class');
        const finalSelected = finalClasses?.includes('border-blue-500');
        const finalClusters = await page.locator('button').filter({ hasText: /APR\.[A-Z]/ }).count();

        console.log(`\nFINAL STATE on Task ${currentTaskId}:`);
        console.log(`  APR selected: ${finalSelected}`);
        console.log(`  APR clusters visible: ${finalClusters}`);

        if (finalSelected) {
          console.log('\n❌ BUG CONFIRMED: Selections persisted to new task');
        } else {
          console.log('\n✅ GOOD: Selections cleared on new task');
        }

        break;
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
