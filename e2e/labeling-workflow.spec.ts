/**
 * E2E tests for complete labeling workflow
 */

import { test, expect } from '@playwright/test';

test.describe('Labeling Workflow', () => {
  test('should complete full labeling flow for a task', async ({ page }) => {
    // 1. Navigate to landing page
    await page.goto('/');

    // 2. Verify landing page is displayed
    await expect(page.getByText('Mathebattle Labeling')).toBeVisible();

    // 3. Select labeler_1
    await page.getByRole('button', { name: /LABELER 1/i }).click();

    // 4. Click Start Labeling button
    await page.getByRole('button', { name: /Start Labeling/i }).click();

    // 5. Should navigate to labeling page
    await expect(page).toHaveURL('/label');

    // 5. Wait for tasks to load
    await page.waitForSelector('text=Task 1 of', { timeout: 10000 });

    // 6. Verify task display is shown
    await expect(page.getByText(/Task 1 of/)).toBeVisible();

    // 7. Select a domain
    await page.getByRole('button', { name: /CC/i }).first().click();

    // 8. Wait for clusters to load after domain selection
    await page.waitForSelector('h3:has-text("2. Select Cluster")');
    await page.waitForTimeout(1000); // Allow time for cluster API call to complete

    // 9. Select a cluster
    // Cluster buttons are within the cluster selector section and contain cluster IDs
    // Find the first button within the cluster selector container
    const clusterButtons = page.locator('div.bg-white.rounded-lg.shadow-md:has(h3:has-text("2. Select Cluster")) button');
    await clusterButtons.first().click();

    // 10. Wait for standards to load
    await page.waitForTimeout(1000);

    // 11. Select a standard
    // Standard buttons contain standard IDs like "CCSS.MATH.CONTENT.6.RP.A.1"
    const standardButtons = page.locator('div.bg-white.rounded-lg.shadow-md:has(h3:has-text("3. Select Standard")) button');
    await standardButtons.first().click();

    // 12. Wait for ranking interface to appear
    await page.waitForTimeout(500);

    // 13. Verify Submit button is enabled
    const submitButton = page.getByRole('button', { name: /Submit Label/i });
    await expect(submitButton).toBeEnabled();

    // Note: We won't actually submit to avoid creating test data
    // In a real test environment, we would:
    // await submitButton.click();
    // await expect(page.getByText(/Task 2 of/)).toBeVisible();
  });

  test('should handle navigation between tasks', async ({ page }) => {
    // Navigate to label page with labeler_1
    await page.goto('/?labeler=labeler_1');
    await page.waitForURL('/label');

    // Wait for tasks to load
    await page.waitForSelector('text=Task', { timeout: 10000 });

    // Check that Previous button is disabled on first task (use first() as we have top and bottom buttons)
    const prevButton = page.getByRole('button', { name: /Previous/i }).first();
    await expect(prevButton).toBeDisabled();

    // Next button should be enabled
    const nextButton = page.getByRole('button', { name: /Next/i }).first();
    await expect(nextButton).toBeEnabled();

    // Click Next
    await nextButton.click();

    // Wait for task change
    await page.waitForTimeout(500);

    // Now Previous should be enabled
    await expect(prevButton).toBeEnabled();

    // Click Previous to go back
    await prevButton.click();

    // Should be back to task 1
    await expect(prevButton).toBeDisabled();
  });

  test('should persist labeler ID in localStorage', async ({ page }) => {
    // Go to landing page and select labeler
    await page.goto('/');
    await page.getByRole('button', { name: /LABELER 2/i }).click();

    // Click Start Labeling button
    await page.getByRole('button', { name: /Start Labeling/i }).click();

    // Wait for navigation
    await page.waitForURL('/label');

    // Reload the page
    await page.reload();

    // Should still be on label page (not redirected to landing)
    await expect(page).toHaveURL('/label');

    // Verify labeler ID is displayed
    await expect(page.getByText(/labeler_2/i)).toBeVisible();
  });

  test('should show hierarchical selection flow correctly', async ({ page }) => {
    // Navigate directly to label page
    await page.goto('/?labeler=labeler_1');
    await page.waitForURL('/label');

    // Wait for page to load
    await page.waitForSelector('text=1. Select Domain', { timeout: 10000 });

    // Verify all selection steps are shown
    await expect(page.getByText('1. Select Domain')).toBeVisible();
    await expect(page.getByText('2. Select Cluster')).toBeVisible();
    await expect(page.getByText('3. Select Standard')).toBeVisible();
    await expect(page.getByText('4. Rank Standards')).toBeVisible();
  });

  test('should disable submit button when no standards selected', async ({ page }) => {
    // Navigate to label page
    await page.goto('/?labeler=labeler_1');
    await page.waitForURL('/label');

    // Wait for page to load
    await page.waitForSelector('text=Submit Label', { timeout: 10000 });

    // Submit button should be disabled initially
    const submitButton = page.getByRole('button', { name: /Submit Label/i });
    await expect(submitButton).toBeDisabled();
  });

  test('should handle auto-detection of labeler from URL', async ({ page }) => {
    // Go directly with labeler query param
    await page.goto('/?labeler=labeler_3');

    // Should auto-navigate to label page
    await page.waitForURL('/label', { timeout: 5000 });

    // Verify we're on the label page
    await expect(page.getByText(/labeler_3/i)).toBeVisible();
  });

  test('should redirect to landing page if no labeler ID', async ({ page }) => {
    // Clear localStorage first
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Try to go directly to label page
    await page.goto('/label');

    // Should redirect to landing page
    await page.waitForURL('/', { timeout: 5000 });
    await expect(page.getByText('Select Your Labeler ID')).toBeVisible();
  });
});

test.describe('Progress Tracking', () => {
  test('should show progress bar', async ({ page }) => {
    await page.goto('/?labeler=labeler_1');
    await page.waitForURL('/label');

    // Wait for progress bar to load
    await page.waitForSelector('text=Task', { timeout: 10000 });

    // Verify progress information is shown
    await expect(page.getByText(/Task \d+ of \d+/)).toBeVisible();
    await expect(page.getByText(/Labeled: \d+ tasks/)).toBeVisible();
  });
});
