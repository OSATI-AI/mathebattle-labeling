const { chromium } = require('@playwright/test');

/**
 * Performance test for task navigation
 *
 * Tests that:
 * 1. Navigating between tasks completes within 2 seconds
 * 2. Task images load reasonably fast
 */
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testLabelerId = `test-perf-${Date.now()}`;
  await context.addInitScript((id) => {
    localStorage.setItem('labeler_id', id);
  }, testLabelerId);

  const url = process.env.DEPLOYMENT_URL || 'https://mathebattle-labeling.vercel.app/label';
  console.log(`\n🧪 Testing navigation performance: ${url}\n`);

  const measurements = {
    initialLoad: null,
    taskImageLoad: [],
    nextNavigation: [],
    prevNavigation: [],
  };

  try {
    // Initial page load
    const loadStart = Date.now();
    await page.goto(url, { timeout: 60000, waitUntil: 'networkidle' });
    measurements.initialLoad = Date.now() - loadStart;
    console.log(`Initial page load: ${measurements.initialLoad}ms`);

    // Wait for first task to load
    const taskHeader = page.locator('h2').filter({ hasText: /Task #\d+/ }).first();
    const imageLoadStart = Date.now();
    await taskHeader.waitFor({ state: 'visible', timeout: 45000 });

    // Wait for images to appear
    const taskImage = page.locator('img[alt="Task"]');
    await taskImage.waitFor({ state: 'visible', timeout: 45000 });
    const imageLoadTime = Date.now() - imageLoadStart;
    measurements.taskImageLoad.push(imageLoadTime);
    console.log(`✓ First task loaded in ${imageLoadTime}ms`);

    // Helper: Select and submit a task
    const labelAndSubmit = async () => {
      const domain = page.locator('button').filter({ hasText: /^APR/ }).first();
      await domain.click();
      await page.waitForTimeout(1000);

      const cluster = page.locator('button').filter({ hasText: /A-APR\.A/ }).first();
      await cluster.waitFor({ state: 'visible', timeout: 10000 });
      await cluster.click();
      await page.waitForTimeout(1000);

      const standard = page.locator('button').filter({ hasText: /A-APR\.A\.\d+/ }).first();
      await standard.waitFor({ state: 'visible', timeout: 10000 });
      await standard.click();
      await page.waitForTimeout(500);

      const submitButton = page.locator('button:has-text("Submit Label")');
      await submitButton.click();
    };

    // Label and submit first task
    await labelAndSubmit();
    console.log('✓ Submitted first task');

    // Measure navigation to next task (Task 2)
    const nav1Start = Date.now();
    await taskHeader.waitFor({ state: 'visible', timeout: 45000 });
    await taskImage.waitFor({ state: 'visible', timeout: 45000 });
    const nav1Time = Date.now() - nav1Start;
    measurements.nextNavigation.push(nav1Time);
    console.log(`✓ Navigated to Task 2 in ${nav1Time}ms`);

    if (nav1Time > 2000) {
      console.warn(`⚠️  WARNING: Navigation took ${nav1Time}ms (target: <2000ms)`);
    }

    // Label and submit second task
    await labelAndSubmit();
    console.log('✓ Submitted second task');

    // Measure navigation to next task (Task 3)
    const nav2Start = Date.now();
    await taskHeader.waitFor({ state: 'visible', timeout: 45000 });
    await taskImage.waitFor({ state: 'visible', timeout: 45000 });
    const nav2Time = Date.now() - nav2Start;
    measurements.nextNavigation.push(nav2Time);
    console.log(`✓ Navigated to Task 3 in ${nav2Time}ms`);

    if (nav2Time > 2000) {
      console.warn(`⚠️  WARNING: Navigation took ${nav2Time}ms (target: <2000ms)`);
    }

    // Measure navigation backwards (Previous button)
    const prevButton = page.locator('button:has-text("Previous")').first();

    const prevNav1Start = Date.now();
    await prevButton.click();
    await taskHeader.waitFor({ state: 'visible', timeout: 45000 });
    await taskImage.waitFor({ state: 'visible', timeout: 45000 });
    const prevNav1Time = Date.now() - prevNav1Start;
    measurements.prevNavigation.push(prevNav1Time);
    console.log(`✓ Navigated back to Task 2 in ${prevNav1Time}ms`);

    if (prevNav1Time > 2000) {
      console.warn(`⚠️  WARNING: Previous navigation took ${prevNav1Time}ms (target: <2000ms)`);
    }

    const prevNav2Start = Date.now();
    await prevButton.click();
    await taskHeader.waitFor({ state: 'visible', timeout: 45000 });
    await taskImage.waitFor({ state: 'visible', timeout: 45000 });
    const prevNav2Time = Date.now() - prevNav2Start;
    measurements.prevNavigation.push(prevNav2Time);
    console.log(`✓ Navigated back to Task 1 in ${prevNav2Time}ms`);

    if (prevNav2Time > 2000) {
      console.warn(`⚠️  WARNING: Previous navigation took ${prevNav2Time}ms (target: <2000ms)`);
    }

    // Calculate averages
    const avgNext = measurements.nextNavigation.reduce((a, b) => a + b, 0) / measurements.nextNavigation.length;
    const avgPrev = measurements.prevNavigation.reduce((a, b) => a + b, 0) / measurements.prevNavigation.length;

    console.log('\n=== PERFORMANCE SUMMARY ===');
    console.log(`Initial page load: ${measurements.initialLoad}ms`);
    console.log(`First task image load: ${measurements.taskImageLoad[0]}ms`);
    console.log(`Average Next navigation: ${Math.round(avgNext)}ms`);
    console.log(`Average Previous navigation: ${Math.round(avgPrev)}ms`);

    // Check if performance meets targets
    const failures = [];
    if (avgNext > 2000) {
      failures.push(`Next navigation too slow: ${Math.round(avgNext)}ms (target: <2000ms)`);
    }
    if (avgPrev > 2000) {
      failures.push(`Previous navigation too slow: ${Math.round(avgPrev)}ms (target: <2000ms)`);
    }

    if (failures.length > 0) {
      console.log('\n❌ PERFORMANCE ISSUES DETECTED:');
      failures.forEach(f => console.log(`  - ${f}`));
      process.exit(1);
    } else {
      console.log('\n✅ All performance targets met!\n');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'performance-test-error.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
