import { test, expect } from '@playwright/test';

test.describe('Labeled Task Selection Restoration', () => {
  test('should show previous selections when navigating back to labeled task', async ({ page }) => {
    // Navigate to label page with a test labeler
    await page.goto('/label?labeler=labeler_test_' + Date.now());

    // Wait for task to load
    await page.waitForSelector('text=/Task \\d+ of \\d+/', { timeout: 20000 });

    // Step 1: Label a task with specific selections
    console.log('Step 1: Selecting domain...');
    const domainButton = await page.locator('button:has-text("CC")').first();
    await domainButton.waitFor({ state: 'visible', timeout: 10000 });
    await domainButton.click();

    // Wait for clusters to load
    console.log('Step 2: Waiting for clusters...');
    await page.waitForTimeout(2000); // Give time for API call

    // Find a cluster button (any cluster containing .CC.)
    const clusterButton = await page.locator('button').filter({ hasText: /\.CC\./ }).first();

    // Check if cluster button exists
    const clusterCount = await page.locator('button').filter({ hasText: /\.CC\./ }).count();
    console.log(`Found ${clusterCount} cluster buttons`);

    if (clusterCount > 0) {
      await clusterButton.click();

      // Wait for standards to load
      console.log('Step 3: Waiting for standards...');
      await page.waitForTimeout(2000);

      // Select a standard
      const standardButton = await page.locator('button').filter({ hasText: /\.CC\.[A-Z]\.\d/ }).first();
      const standardCount = await page.locator('button').filter({ hasText: /\.CC\.[A-Z]\.\d/ }).count();
      console.log(`Found ${standardCount} standard buttons`);

      if (standardCount > 0) {
        await standardButton.click();

        // Wait for ranking interface to update
        await page.waitForTimeout(1000);

        // Submit the label
        const submitButton = await page.locator('button:has-text("Submit Label")');
        await expect(submitButton).toBeEnabled({ timeout: 5000 });
        await submitButton.click();

        // Wait for navigation to next task
        await page.waitForTimeout(3000);

        // Navigate back to the previous task
        console.log('Step 4: Navigating back...');
        const prevButton = await page.locator('button:has-text("Previous")').first();
        await prevButton.click();

        // Wait for page to update
        await page.waitForTimeout(2000);

        // Step 5: Check if selections are restored
        console.log('Step 5: Checking if selections are restored...');

        // Check if "already labeled" message appears
        const labeledMessage = await page.locator('text=/This task has already been labeled/');
        await expect(labeledMessage).toBeVisible({ timeout: 5000 });

        // Check if domain button is selected (should have blue styling)
        const domainButtonAfter = await page.locator('button:has-text("CC")').first();
        const domainClasses = await domainButtonAfter.getAttribute('class');
        expect(domainClasses).toContain('border-blue-500');
        expect(domainClasses).toContain('bg-blue-50');

        // Check if clusters are visible
        const clusterButtonsAfter = await page.locator('button').filter({ hasText: /\.CC\./ }).count();
        expect(clusterButtonsAfter).toBeGreaterThan(0);

        // Check if at least one cluster is selected
        const selectedClusters = await page.locator('button.border-blue-500').filter({ hasText: /\.CC\./ }).count();
        expect(selectedClusters).toBeGreaterThan(0);

        // Check if PRIMARY badge is visible in ranking interface
        const primaryBadge = await page.locator('text=PRIMARY');
        await expect(primaryBadge).toBeVisible({ timeout: 5000 });

        console.log('Test passed: Selections are properly restored!');
      } else {
        console.log('No standards found - clusters may not be loading properly');
        test.fail();
      }
    } else {
      console.log('No clusters found - domains may not be loading clusters properly');
      test.fail();
    }
  });

  test('should clear selections when navigating to unlabeled task', async ({ page }) => {
    // Navigate to label page with a test labeler
    await page.goto('/label?labeler=labeler_test_clear_' + Date.now());

    // Wait for task to load
    await page.waitForSelector('text=/Task \\d+ of \\d+/', { timeout: 20000 });

    // The first task should have no selections
    const primaryBadge = await page.locator('text=PRIMARY');
    await expect(primaryBadge).not.toBeVisible();

    // Check that no domain buttons are selected
    const selectedDomains = await page.locator('button.border-blue-500.bg-blue-50').filter({ hasText: /^[A-Z]+$/ }).count();
    expect(selectedDomains).toBe(0);
  });
});