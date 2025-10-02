import { test, expect } from '@playwright/test';

// Test against deployed production app
const PROD_URL = 'https://mathebattle-labeling-wielands-projects-edb6f5fe.vercel.app';

test.describe('Deployed App - Labeled Task Selection Restoration', () => {
  test('should show previous selections when navigating back to labeled task', async ({ page }) => {
    // Use labeler_3 for testing (one of the valid IDs)
    const labelerId = 'labeler_3';

    // Navigate directly using the URL parameter (this will auto-login)
    await page.goto(`${PROD_URL}/?labeler=${labelerId}`);

    // Wait for navigation to label page (auto-redirect happens)
    await page.waitForURL('**/label', { timeout: 10000 });

    // Wait for task to load
    await page.waitForSelector('text=/Task \\d+ of \\d+/', { timeout: 20000 });

    // Get current task number to track if we're on the same task
    const taskText = await page.locator('text=/Task \\d+ of \\d+/').textContent();
    console.log(`Starting with: ${taskText}`);

    // Step 1: Label a task with specific selections
    console.log('Step 1: Selecting domain...');
    const domainButton = await page.locator('button:has-text("CC")').first();
    await domainButton.waitFor({ state: 'visible', timeout: 10000 });
    await domainButton.click();

    // Wait for clusters to load
    console.log('Step 2: Waiting for clusters...');
    await page.waitForTimeout(3000); // Give time for API call

    // Check if clusters loaded
    const clusterCount = await page.locator('button').filter({ hasText: /\.CC\./ }).count();
    console.log(`Found ${clusterCount} cluster buttons`);

    if (clusterCount === 0) {
      // Take screenshot for debugging
      await page.screenshot({
        path: 'test-results/no-clusters-deployed.png',
        fullPage: true
      });
      throw new Error('No clusters loaded after selecting CC domain');
    }

    // Remember which cluster we're selecting
    const clusterButton = await page.locator('button').filter({ hasText: /\.CC\./ }).first();
    const clusterText = await clusterButton.textContent();
    console.log(`Selecting cluster: ${clusterText}`);
    await clusterButton.click();

    // Wait for standards to load
    console.log('Step 3: Waiting for standards...');
    await page.waitForTimeout(3000);

    // Select a standard if available
    const standardCount = await page.locator('button').filter({ hasText: /\.CC\.[A-Z]\.\d/ }).count();
    console.log(`Found ${standardCount} standard buttons`);

    let standardText = '';
    if (standardCount > 0) {
      const standardButton = await page.locator('button').filter({ hasText: /\.CC\.[A-Z]\.\d/ }).first();
      standardText = await standardButton.textContent();
      console.log(`Selecting standard: ${standardText}`);
      await standardButton.click();
      await page.waitForTimeout(1000);
    }

    // Submit the label
    const submitButton = await page.locator('button:has-text("Submit Label")');
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();

    // Wait for navigation to next task
    console.log('Step 4: Waiting for next task...');
    await page.waitForTimeout(3000);

    // Verify we moved to a new task
    const newTaskText = await page.locator('text=/Task \\d+ of \\d+/').textContent();
    console.log(`Now on: ${newTaskText}`);

    // Navigate back to the previous task
    console.log('Step 5: Navigating back...');
    const prevButton = await page.locator('button:has-text("Previous")').first();
    await prevButton.click();

    // Wait for page to update
    await page.waitForTimeout(3000);

    // Step 6: Check if selections are restored
    console.log('Step 6: Checking if selections are restored...');

    // Take screenshot of current state
    await page.screenshot({
      path: 'test-results/labeled-task-deployed.png',
      fullPage: true
    });

    // Check if "already labeled" message appears
    const labeledMessage = await page.locator('text=/This task has already been labeled/');
    const isLabeledVisible = await labeledMessage.isVisible().catch(() => false);

    if (!isLabeledVisible) {
      console.log('ERROR: "Already labeled" message not visible');

      // Debug: Check what messages are visible
      const anyMessages = await page.locator('text=/labeled/i').count();
      console.log(`Found ${anyMessages} messages containing "labeled"`);
    } else {
      console.log('✓ "Already labeled" message is visible');
    }

    // Check if domain button is selected (blue styling)
    const domainButtonAfter = await page.locator('button:has-text("CC")').first();
    const domainClasses = await domainButtonAfter.getAttribute('class');
    const isDomainSelected = domainClasses?.includes('border-blue-500') && domainClasses?.includes('bg-blue-50');

    if (!isDomainSelected) {
      console.log(`ERROR: Domain button not selected. Classes: ${domainClasses}`);
    } else {
      console.log('✓ Domain button shows as selected');
    }

    // Check if clusters are visible
    const clustersAfterCount = await page.locator('button').filter({ hasText: /\.CC\./ }).count();
    if (clustersAfterCount === 0) {
      console.log('ERROR: No clusters visible after navigating back');

      // Debug: Check if any loading state
      const loadingIndicators = await page.locator('text=/loading/i').count();
      console.log(`Found ${loadingIndicators} loading indicators`);
    } else {
      console.log(`✓ ${clustersAfterCount} clusters visible`);

      // Check if our selected cluster is shown as selected
      const selectedClusterButton = await page.locator('button.border-blue-500').filter({ hasText: clusterText || /\.CC\./ }).first();
      const isClusterSelected = await selectedClusterButton.count() > 0;

      if (!isClusterSelected) {
        console.log(`ERROR: Previously selected cluster "${clusterText}" not showing as selected`);
      } else {
        console.log(`✓ Cluster "${clusterText}" shows as selected`);
      }
    }

    // Check if PRIMARY badge is visible in ranking interface
    const primaryBadge = await page.locator('text=PRIMARY');
    const isPrimaryVisible = await primaryBadge.isVisible().catch(() => false);

    if (!isPrimaryVisible) {
      console.log('ERROR: PRIMARY badge not visible in ranking interface');

      // Debug: Check what's in the ranking area
      const rankingArea = await page.locator('text=/rank/i').count();
      console.log(`Found ${rankingArea} elements containing "rank"`);
    } else {
      console.log('✓ PRIMARY badge visible in ranking interface');
    }

    // Final assertions (soft assertions to see all failures)
    await expect.soft(labeledMessage).toBeVisible();
    expect(isDomainSelected).toBeTruthy();
    expect(clustersAfterCount).toBeGreaterThan(0);
    expect(isPrimaryVisible).toBeTruthy();
  });
});