import { test, expect } from '@playwright/test';

// Get deployment URL from environment or use production URL
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'https://mathebattle-labeling.vercel.app';

test.describe('Label Page E2E Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set labeler ID in localStorage before navigating
    await context.addInitScript(() => {
      localStorage.setItem('labeler_id', 'test-user-e2e');
    });

    // Navigate to label page
    await page.goto(`${DEPLOYMENT_URL}/label`);

    // Wait for page to load - increase timeout
    await page.waitForSelector('text=Mathebattle Labeling Interface', { timeout: 30000 });
  });

  test('should load tasks successfully', async ({ page }) => {
    // Wait for tasks to load (progress bar should appear)
    const progressText = await page.locator('text=/Task \\d+ of \\d+/').first();
    await expect(progressText).toBeVisible({ timeout: 15000 });

    // Check that we have tasks
    const text = await progressText.textContent();
    expect(text).toMatch(/Task \d+ of \d+/);
  });

  test('should display task and solution images', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('text=/Task \\d+ of \\d+/', { timeout: 15000 });

    // Wait for loading to finish
    await page.waitForTimeout(3000);

    // Should NOT show placeholder messages
    const noTaskImage = page.locator('text=No task image');
    const noSolutionImage = page.locator('text=No solution image');
    await expect(noTaskImage).not.toBeVisible();
    await expect(noSolutionImage).not.toBeVisible();

    // Wait for actual images to appear
    const taskImage = page.locator('img[alt="Task"]');
    const solutionImage = page.locator('img[alt="Solution"]');

    await expect(taskImage).toBeVisible({ timeout: 30000 });
    await expect(solutionImage).toBeVisible({ timeout: 30000 });

    // Verify images have actual base64 data
    const taskSrc = await taskImage.getAttribute('src');
    const solutionSrc = await solutionImage.getAttribute('src');

    expect(taskSrc).toBeTruthy();
    expect(solutionSrc).toBeTruthy();
    expect(taskSrc).toContain('data:image'); // Should be base64 data URI
    expect(solutionSrc).toContain('data:image');

    // Verify images are actually large (not empty/broken)
    expect(taskSrc.length).toBeGreaterThan(10000); // Base64 images should be substantial
    expect(solutionSrc.length).toBeGreaterThan(10000);
  });

  test('should show domains for selection', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('text=/Task \\d+ of \\d+/', { timeout: 15000 });

    // Check that domains are available
    const domainsHeading = page.locator('text=1. Select Domain');
    await expect(domainsHeading).toBeVisible();

    // Should have domain buttons (not checkboxes - interface uses buttons)
    const domainButton = page.locator('button').filter({ hasText: /^[A-Z]+$/ }).first();
    await expect(domainButton).toBeVisible();
  });

  test('should show clusters when domain is selected', async ({ page }) => {
    // Wait for page and domains to load
    await page.waitForSelector('text=/Task \\d+ of \\d+/', { timeout: 15000 });
    await page.waitForSelector('text=1. Select Domain', { timeout: 5000 });

    // Find and click the first domain button (they use buttons, not checkboxes)
    const firstDomainButton = page.locator('button').filter({ hasText: /^APR/ }).first();
    await expect(firstDomainButton).toBeVisible({ timeout: 10000 });
    await firstDomainButton.click();

    // Wait for clusters to load
    await page.waitForTimeout(1000);

    // Check that clusters section appears
    const clustersHeading = page.locator('text=2. Select Cluster');
    await expect(clustersHeading).toBeVisible();

    // Should NOT show "No clusters found"
    const noClustersMessage = page.locator('text=No clusters found for selected domains.');
    await expect(noClustersMessage).not.toBeVisible();

    // Should show at least one cluster button (look for buttons with cluster IDs like "A-APR.A")
    const clusterButton = page.locator('button').filter({ hasText: /A-APR\.[A-Z]/ }).first();
    await expect(clusterButton).toBeVisible();
  });

  test('should allow selecting and ranking standards', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('text=/Task \\d+ of \\d+/', { timeout: 15000 });
    await page.waitForSelector('text=1. Select Domain', { timeout: 5000 });

    // Select a domain (using button, not checkbox)
    const firstDomainButton = page.locator('button').filter({ hasText: /^APR/ }).first();
    await expect(firstDomainButton).toBeVisible({ timeout: 10000 });
    await firstDomainButton.click();
    await page.waitForTimeout(1000);

    // Check standards section exists
    const standardsHeading = page.locator('text=3. Select and Rank Standard');
    await expect(standardsHeading).toBeVisible();
  });
});
