import { test, expect } from '@playwright/test';

// Get deployment URL from environment or use latest
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'https://mathebattle-labeling-3dklmwdop-wielands-projects-edb6f5fe.vercel.app';

test.describe('Full Labeling Workflow E2E', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set unique labeler ID for this test run
    const testLabelerId = `test-workflow-${Date.now()}`;
    await context.addInitScript((id) => {
      localStorage.setItem('labeler_id', id);
    }, testLabelerId);

    // Navigate to label page
    await page.goto(`${DEPLOYMENT_URL}/label`);

    // Wait for page to load
    await page.waitForSelector('text=Mathebattle Labeling Interface', { timeout: 30000 });
    await page.waitForSelector('text=/Task \\d+ of \\d+/', { timeout: 15000 });
  });

  test('label persistence: verify selections are preserved when navigating back to labeled task', async ({ page }) => {
    // Step 1: Wait for first task to fully load
    console.log('Step 1: Waiting for task to load...');
    await expect(page.locator('text=1. Select Domain')).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(2000); // Wait for images to load

    // Get the first task ID for later verification
    const taskHeader = await page.locator('h2').filter({ hasText: /Task #\d+/ }).first();
    await expect(taskHeader).toBeVisible({ timeout: 10000 });
    const firstTaskText = await taskHeader.textContent();
    const firstTaskId = firstTaskText?.match(/Task #(\d+)/)?.[1];
    console.log(`First task ID: ${firstTaskId}`);
    expect(firstTaskId).toBeTruthy();

    // Step 2: Select a domain
    console.log('Step 2: Selecting domain APR...');
    const aprDomain = page.locator('button').filter({ hasText: /^APR/ }).first();
    await expect(aprDomain).toBeVisible({ timeout: 10000 });
    await aprDomain.click();
    
    // Verify domain is selected (button should have blue background)
    await page.waitForTimeout(500);

    // Step 3: Wait for clusters to load and select one
    console.log('Step 3: Waiting for clusters and selecting one...');
    await page.waitForSelector('text=2. Select Cluster', { timeout: 10000 });
    
    // Wait for cluster buttons to appear
    const firstCluster = page.locator('button').filter({ hasText: /A-APR\.[A-Z]/ }).first();
    await expect(firstCluster).toBeVisible({ timeout: 10000 });
    await firstCluster.click();
    
    // Get cluster ID for verification
    const firstClusterText = await firstCluster.textContent();
    const clusterId = firstClusterText?.split('\n')[0].trim();
    console.log(`Selected cluster: ${clusterId}`);
    
    await page.waitForTimeout(500);

    // Step 4: Wait for standards to load and select one
    console.log('Step 4: Waiting for standards and selecting one...');
    await page.waitForSelector('text=3. Select Standard', { timeout: 10000 });

    // Wait for standard buttons to appear (standards are displayed as clickable buttons, not checkboxes)
    await page.waitForTimeout(2000);

    // Find and click the first standard button
    // Look for any button containing standard ID pattern (they're in a specific section)
    const firstStandardButton = page.locator('button').filter({ hasText: /A-APR\.A\.\d+/ }).first();
    await expect(firstStandardButton).toBeVisible({ timeout: 10000 });
    await firstStandardButton.click();

    await page.waitForTimeout(500);

    // Verify ranking interface appears
    const rankingHeading = page.locator('text=4. Rank');
    await expect(rankingHeading).toBeVisible({ timeout: 5000 });

    // Step 5: Submit the label
    console.log('Step 5: Submitting label...');
    const submitButton = page.locator('button:has-text("Submit Label")');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Wait for submission to complete and page to navigate to next task
    // Wait for the task header to change
    await page.waitForFunction(
      (expectedId) => {
        const header = document.querySelector('h2');
        const text = header?.textContent || '';
        const match = text.match(/Task #(\d+)/);
        const currentId = match?.[1];
        console.log(`Checking task ID: ${currentId} (expecting different from ${expectedId})`);
        return currentId && currentId !== expectedId;
      },
      firstTaskId,
      { timeout: 10000 }
    );

    // Verify we're on a different task (task number should have changed)
    const newTaskHeader = await page.locator('h2:has-text("Task #")').first().textContent();
    const secondTaskId = newTaskHeader?.match(/Task #(\d+)/)?.[1];
    console.log(`Navigated to task ID: ${secondTaskId}`);
    expect(secondTaskId).toBeTruthy();
    expect(secondTaskId).not.toBe(firstTaskId);

    // Step 6: Navigate back to the previous task
    console.log('Step 6: Navigating back to first task...');
    const previousButton = page.locator('button:has-text("Previous")').first();
    await expect(previousButton).toBeEnabled();
    await previousButton.click();

    // Wait for navigation and page to settle
    await page.waitForTimeout(3000);

    // Verify we're back on the first task
    const returnedTaskHeader = await page.locator('h2:has-text("Task #")').first().textContent();
    const returnedTaskId = returnedTaskHeader?.match(/Task #(\d+)/)?.[1];
    console.log(`Returned to task ID: ${returnedTaskId}`);
    expect(returnedTaskId).toBe(firstTaskId);

    // Step 7: Verify the task shows as already labeled
    console.log('Step 7: Verifying task shows as labeled...');
    const labeledBanner = page.locator('text=This task has already been labeled');
    await expect(labeledBanner).toBeVisible({ timeout: 5000 });

    // Step 8: Verify the previously selected domain is still selected
    console.log('Step 8: Verifying selections are preserved...');
    const selectedDomain = page.locator('button').filter({ hasText: /^APR/ }).first();
    await expect(selectedDomain).toBeVisible();

    // Check if it has the blue background (selected state)
    const domainClasses = await selectedDomain.getAttribute('class');
    expect(domainClasses).toContain('border-blue-500');
    expect(domainClasses).toContain('bg-blue-50');

    // Step 9: Verify the cluster selection is preserved
    console.log('Step 9: Verifying cluster selection is preserved...');
    if (clusterId) {
      const selectedCluster = page.locator('button').filter({ hasText: clusterId }).first();
      await expect(selectedCluster).toBeVisible({ timeout: 5000 });

      const clusterClasses = await selectedCluster.getAttribute('class');
      expect(clusterClasses).toContain('border-blue-500');
      expect(clusterClasses).toContain('bg-blue-50');
    }

    console.log('✅ Full workflow test completed successfully!');
  });

  test('verify submit button is disabled until standard is selected', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('text=1. Select Domain', { timeout: 10000 });
    
    // Submit button should be disabled initially
    const submitButton = page.locator('button:has-text("Submit Label")');
    await expect(submitButton).toBeDisabled();
    
    // Select domain
    const aprDomain = page.locator('button').filter({ hasText: /^APR/ }).first();
    await aprDomain.click();
    await page.waitForTimeout(1000);
    
    // Still disabled (no standard selected)
    await expect(submitButton).toBeDisabled();
    
    // Select cluster
    const firstCluster = page.locator('button').filter({ hasText: /A-APR\.[A-Z]/ }).first();
    await expect(firstCluster).toBeVisible({ timeout: 10000 });
    await firstCluster.click();
    await page.waitForTimeout(1000);
    
    // Still disabled (no standard selected)
    await expect(submitButton).toBeDisabled();

    // Wait for standards to load
    await page.waitForTimeout(2000);

    // Select standard (standards are buttons with IDs like "A-APR.A.1")
    const firstStandardButton = page.locator('button').filter({ hasText: /A-APR\.A\.\d+/ }).first();
    await expect(firstStandardButton).toBeVisible({ timeout: 10000 });
    await firstStandardButton.click();
    await page.waitForTimeout(500);

    // Now should be enabled
    await expect(submitButton).toBeEnabled();
  });
});
