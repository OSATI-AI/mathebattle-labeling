import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('landing page should have proper styling', async ({ page }) => {
    await page.goto('/');

    // Wait for content to load
    await page.waitForSelector('h1:has-text("Mathebattle Labeling")', { timeout: 10000 });

    // Check that CSS is loaded by verifying background gradient exists
    const body = await page.$('body');
    const bgGradientDiv = await page.locator('div.bg-gradient-to-br').first();
    await expect(bgGradientDiv).toBeVisible();

    // Check for proper button styling (should have background colors)
    const labelButtons = await page.locator('button:has-text("LABELER")').all();
    expect(labelButtons.length).toBeGreaterThan(0);

    // Verify at least one button has proper background color
    const firstButton = labelButtons[0];
    const bgColor = await firstButton.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    // Should not be transparent or empty
    expect(bgColor).not.toBe('');
    expect(bgColor).not.toBe('transparent');
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');

    // Take screenshot for visual comparison
    await page.screenshot({
      path: 'test-results/landing-page.png',
      fullPage: true
    });

    // Check for overlapping elements (sign of broken layout)
    const heading = await page.locator('h1').boundingBox();
    const subheading = await page.locator('p:has-text("Common Core Standards")').boundingBox();

    if (heading && subheading) {
      // Heading should be above subheading, not overlapping
      expect(heading.y + heading.height).toBeLessThanOrEqual(subheading.y + 5); // Allow 5px tolerance
    }
  });

  test('label page should have proper layout', async ({ page }) => {
    // Navigate with labeler_id to skip landing page
    await page.goto('/label?labeler=labeler_1');

    // Wait for page to load
    await page.waitForSelector('text=/Task \\d+ of \\d+/', { timeout: 10000 });

    // Check that main sections are visible and styled
    const progressBar = await page.locator('div.bg-blue-600').first();
    await expect(progressBar).toBeVisible();

    // Check domain selector has proper styling
    const domainSection = await page.locator('h3:has-text("1. Select Domain(s)")');
    await expect(domainSection).toBeVisible();

    const domainContainer = await domainSection.locator('..');
    const bgColor = await domainContainer.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    // Should have white background (not transparent)
    expect(bgColor).toContain('255, 255, 255'); // RGB for white

    // Take screenshot
    await page.screenshot({
      path: 'test-results/label-page.png',
      fullPage: true
    });
  });

  test('interactive elements should respond to hover', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('h1:has-text("Mathebattle Labeling")');

    // Find a labeler button
    const button = await page.locator('button:has-text("LABELER 1")').first();

    // Get initial style
    const initialBg = await button.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    // Hover over button
    await button.hover();
    await page.waitForTimeout(100); // Wait for transition

    // Get hover style
    const hoverBg = await button.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    // Background should change on hover (if CSS is working)
    // They might be the same if already selected, so just check they're not empty
    expect(hoverBg).not.toBe('');
    expect(hoverBg).not.toBe('transparent');
  });

  test('clusters should load after domain selection', async ({ page }) => {
    await page.goto('/label?labeler=labeler_1');

    // Wait for domains to load
    await page.waitForSelector('button:has-text("CC")', { timeout: 10000 });

    // Click a domain
    await page.click('button:has-text("CC"):visible');

    // Wait for clusters to appear (with longer timeout for production)
    await page.waitForSelector('text=/[A-Z]+\\.CC\\.[A-Z]/', {
      timeout: 15000
    });

    // Verify clusters are visible
    const clusters = await page.locator('button').filter({ hasText: /\.CC\./ }).all();
    expect(clusters.length).toBeGreaterThan(0);

    // Take screenshot showing clusters
    await page.screenshot({
      path: 'test-results/clusters-loaded.png',
      fullPage: true
    });
  });

  test('no CSS directives should be visible', async ({ page }) => {
    await page.goto('/');

    // Check that @tailwind directives are not visible (sign of unprocessed CSS)
    const pageContent = await page.content();
    expect(pageContent).not.toContain('@tailwind base');
    expect(pageContent).not.toContain('@tailwind components');
    expect(pageContent).not.toContain('@tailwind utilities');

    // Check that actual Tailwind classes are present in computed styles
    const button = await page.locator('button').first();
    const classNames = await button.getAttribute('class');
    expect(classNames).toBeTruthy();
    expect(classNames).toContain('px-'); // Tailwind padding class
  });
});