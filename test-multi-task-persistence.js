const { chromium } = require('@playwright/test');

/**
 * Comprehensive multi-task label persistence test
 *
 * Tests that labels are correctly preserved and displayed when navigating
 * between multiple labeled tasks in both directions.
 */
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testLabelerId = `test-multi-${Date.now()}`;
  await context.addInitScript((id) => {
    localStorage.setItem('labeler_id', id);
  }, testLabelerId);

  const url = process.env.DEPLOYMENT_URL || 'https://mathebattle-labeling.vercel.app/label';
  console.log(`\n🧪 Testing multi-task label persistence: ${url}\n`);

  // Store expected labels for each task
  const taskLabels = {};

  try {
    await page.goto(url, { timeout: 60000, waitUntil: 'networkidle' });
    console.log('✓ Page loaded');

    // Helper: Wait for task to load
    const waitForTask = async () => {
      const taskHeader = page.locator('h2').filter({ hasText: /Task #\d+/ }).first();
      await taskHeader.waitFor({ state: 'visible', timeout: 45000 });
      const text = await taskHeader.textContent();
      return text?.match(/Task #(\d+)/)?.[1];
    };

    // Helper: Get currently selected labels
    const getSelectedLabels = async () => {
      return await page.evaluate(() => {
        const getSelected = (selector) => {
          const buttons = Array.from(document.querySelectorAll(selector));
          return buttons
            .filter(btn => btn.classList.contains('border-blue-500'))
            .map(btn => btn.textContent?.split('\n')[0].trim());
        };

        return {
          domains: getSelected('button[class*="border"]').filter(t => /^[A-Z]+$/.test(t)),
          clusters: getSelected('button[class*="border"]').filter(t => /^[A-Z]-[A-Z]+\.[A-Z]/.test(t)),
          standards: getSelected('button[class*="border"]').filter(t => /^[A-Z]-[A-Z]+\.[A-Z]\.\d+/.test(t)),
        };
      });
    };

    // Helper: Select labels for a task (select first available of each)
    const selectLabels = async () => {
      // Select first domain (APR is usually available)
      const domain = page.locator('button').filter({ hasText: /^APR/ }).first();
      await domain.click();
      await page.waitForTimeout(2000);
      const domainText = await domain.textContent();
      const domainId = domainText?.split('\n')[0].trim();

      // Select first cluster that appears
      const cluster = page.locator('button').filter({ hasText: /APR\.[A-Z]/ }).first();
      await cluster.waitFor({ state: 'visible', timeout: 15000 });
      await cluster.click();
      await page.waitForTimeout(2000);
      const clusterText = await cluster.textContent();
      const clusterId = clusterText?.split('\n')[0].trim();

      // Select first standard that appears
      const standard = page.locator('button').filter({ hasText: /APR\.[A-Z]\.\d+/ }).first();
      await standard.waitFor({ state: 'visible', timeout: 15000 });
      await standard.click();
      await page.waitForTimeout(1000);
      const standardText = await standard.textContent();
      const standardId = standardText?.split('\n')[0].trim();

      return {
        domain: domainId,
        cluster: clusterId,
        standard: standardId,
      };
    };

    // Helper: Submit
    const submit = async () => {
      const submitButton = page.locator('button:has-text("Submit Label")');
      await submitButton.click();
      await page.waitForTimeout(3000);
    };

    // ===== TASK 1: Label with first domain =====
    console.log('\n=== TASK 1 ===');
    const task1Id = await waitForTask();
    console.log(`Task 1 ID: ${task1Id}`);

    const task1Labels = await selectLabels();
    taskLabels[task1Id] = task1Labels;
    console.log(`✓ Selected for Task 1:`, task1Labels.domain);

    await submit();
    console.log('✓ Submitted Task 1');

    // ===== TASK 2: Label =====
    console.log('\n=== TASK 2 ===');
    const task2Id = await waitForTask();
    console.log(`Task 2 ID: ${task2Id}`);

    if (task2Id === task1Id) {
      throw new Error('Did not navigate to Task 2');
    }

    const task2Labels = await selectLabels();
    taskLabels[task2Id] = task2Labels;
    console.log(`✓ Selected for Task 2:`, task2Labels.domain);

    await submit();
    console.log('✓ Submitted Task 2');

    // ===== TASK 3: Label =====
    console.log('\n=== TASK 3 ===');
    const task3Id = await waitForTask();
    console.log(`Task 3 ID: ${task3Id}`);

    if (task3Id === task2Id || task3Id === task1Id) {
      throw new Error('Did not navigate to Task 3');
    }

    const task3Labels = await selectLabels();
    taskLabels[task3Id] = task3Labels;
    console.log(`✓ Selected for Task 3:`, task3Labels.domain);

    await submit();
    console.log('✓ Submitted Task 3');

    // ===== NAVIGATE BACK TO TASK 2 =====
    console.log('\n=== NAVIGATE BACK TO TASK 2 ===');
    const prevButton = page.locator('button:has-text("Previous")').first();
    await prevButton.click();
    await page.waitForTimeout(3000);

    const returnedTask2Id = await waitForTask();
    console.log(`Returned to Task ID: ${returnedTask2Id}`);

    if (returnedTask2Id !== task2Id) {
      throw new Error(`Expected Task ${task2Id}, got ${returnedTask2Id}`);
    }

    // Verify Task 2 labels are shown
    const displayedTask2Labels = await getSelectedLabels();
    console.log('Displayed labels:', displayedTask2Labels);
    console.log('Expected labels:', taskLabels[task2Id]);

    if (!displayedTask2Labels.domains.includes(taskLabels[task2Id].domain)) {
      throw new Error(`Task 2: Expected domain ${taskLabels[task2Id].domain}, got ${displayedTask2Labels.domains}`);
    }
    console.log('✓ Task 2 domain correct');

    if (!displayedTask2Labels.clusters.includes(taskLabels[task2Id].cluster)) {
      throw new Error(`Task 2: Expected cluster ${taskLabels[task2Id].cluster}, got ${displayedTask2Labels.clusters}`);
    }
    console.log('✓ Task 2 cluster correct');

    // ===== NAVIGATE BACK TO TASK 1 =====
    console.log('\n=== NAVIGATE BACK TO TASK 1 ===');
    await prevButton.click();
    await page.waitForTimeout(3000);

    const returnedTask1Id = await waitForTask();
    console.log(`Returned to Task ID: ${returnedTask1Id}`);

    if (returnedTask1Id !== task1Id) {
      throw new Error(`Expected Task ${task1Id}, got ${returnedTask1Id}`);
    }

    // Verify Task 1 labels are shown
    const displayedTask1Labels = await getSelectedLabels();
    console.log('Displayed labels:', displayedTask1Labels);
    console.log('Expected labels:', taskLabels[task1Id]);

    if (!displayedTask1Labels.domains.includes(taskLabels[task1Id].domain)) {
      throw new Error(`Task 1: Expected domain ${taskLabels[task1Id].domain}, got ${displayedTask1Labels.domains}`);
    }
    console.log('✓ Task 1 domain correct');

    if (!displayedTask1Labels.clusters.includes(taskLabels[task1Id].cluster)) {
      throw new Error(`Task 1: Expected cluster ${taskLabels[task1Id].cluster}, got ${displayedTask1Labels.clusters}`);
    }
    console.log('✓ Task 1 cluster correct');

    // ===== NAVIGATE FORWARD TO TASK 2 AGAIN =====
    console.log('\n=== NAVIGATE FORWARD TO TASK 2 AGAIN ===');
    const nextButton = page.locator('button:has-text("Next")').first();
    await nextButton.click();
    await page.waitForTimeout(3000);

    const returnedTask2IdAgain = await waitForTask();
    console.log(`Navigated to Task ID: ${returnedTask2IdAgain}`);

    if (returnedTask2IdAgain !== task2Id) {
      throw new Error(`Expected Task ${task2Id}, got ${returnedTask2IdAgain}`);
    }

    // Verify Task 2 labels are STILL shown correctly
    const displayedTask2LabelsAgain = await getSelectedLabels();
    console.log('Displayed labels:', displayedTask2LabelsAgain);

    if (!displayedTask2LabelsAgain.domains.includes(taskLabels[task2Id].domain)) {
      throw new Error(`Task 2 (revisit): Expected domain ${taskLabels[task2Id].domain}, got ${displayedTask2LabelsAgain.domains}`);
    }
    console.log('✓ Task 2 domain correct on revisit');

    if (!displayedTask2LabelsAgain.clusters.includes(taskLabels[task2Id].cluster)) {
      throw new Error(`Task 2 (revisit): Expected cluster ${taskLabels[task2Id].cluster}, got ${displayedTask2LabelsAgain.clusters}`);
    }
    console.log('✓ Task 2 cluster correct on revisit');

    // ===== NAVIGATE FORWARD TO TASK 3 AGAIN =====
    console.log('\n=== NAVIGATE FORWARD TO TASK 3 AGAIN ===');
    await nextButton.click();
    await page.waitForTimeout(3000);

    const returnedTask3IdAgain = await waitForTask();
    console.log(`Navigated to Task ID: ${returnedTask3IdAgain}`);

    if (returnedTask3IdAgain !== task3Id) {
      throw new Error(`Expected Task ${task3Id}, got ${returnedTask3IdAgain}`);
    }

    // Verify Task 3 labels are shown correctly
    const displayedTask3LabelsAgain = await getSelectedLabels();
    console.log('Displayed labels:', displayedTask3LabelsAgain);

    if (!displayedTask3LabelsAgain.domains.includes(taskLabels[task3Id].domain)) {
      throw new Error(`Task 3 (revisit): Expected domain ${taskLabels[task3Id].domain}, got ${displayedTask3LabelsAgain.domains}`);
    }
    console.log('✓ Task 3 domain correct on revisit');

    if (!displayedTask3LabelsAgain.clusters.includes(taskLabels[task3Id].cluster)) {
      throw new Error(`Task 3 (revisit): Expected cluster ${taskLabels[task3Id].cluster}, got ${displayedTask3LabelsAgain.clusters}`);
    }
    console.log('✓ Task 3 cluster correct on revisit');

    console.log('\n✅ All multi-task persistence tests passed!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'multi-task-persistence-error.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
