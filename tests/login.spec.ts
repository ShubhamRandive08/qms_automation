import { test, expect } from '@playwright/test';
import { TestResultsHandler } from '../src/utils/testResultHandler';
import { config } from '../src/config/environment';
import * as fs from 'fs';
import * as path from 'path';

let resultsHandler: TestResultsHandler;
const testStartTimes = new Map<string, Date>(); // Track start times

// Custom fixture to include results handler
const testWithResults = test.extend<{ resultsHandler: TestResultsHandler }>({
  resultsHandler: async ({}, use) => {
    const handler = new TestResultsHandler('test-results', 'OrangeHRM-Tests', '1.0.0');
    await use(handler);
  }
});

testWithResults.beforeAll(() => {
  console.log('='.repeat(60));
  console.log('🚀 Starting OrangeHRM Login Tests');
  console.log('='.repeat(60));
  console.log(`🌐 Environment: ${config.ENV}`);
  console.log(`🔗 Base URL: ${config.BASE_URL}`);
  console.log(`👤 Username: ${config.USERNAME}`);
  console.log(`🔒 Password: ${'*'.repeat(config.PASSWORD.length)}`);
  console.log(`⚡ Headless: ${config.HEADLESS}`);
  console.log(`⏱️ Timeout: ${config.TIMEOUT}ms`);
  console.log('='.repeat(60));
});

testWithResults.beforeEach(async ({}, testInfo) => {
  console.log(`\n▶️ Starting test: ${testInfo.title}`);
  console.log(`🏷️ Tags: ${Array.from(testInfo.tags).join(', ') || 'None'}`);
  
  // Store start time
  testStartTimes.set(testInfo.title, new Date());
});

testWithResults.afterEach(async ({ page, resultsHandler }, testInfo) => {
  console.log(`\n📊 Test completed: ${testInfo.title}`);
  console.log(`📈 Status: ${testInfo.status}`);
  console.log(`⏱️ Duration: ${testInfo.duration}ms`);
  
  // Get start time from our map
  const testStartTime = testStartTimes.get(testInfo.title);
  
  // Map Playwright status to our status types
  const statusMap: Record<string, 'PASSED' | 'FAILED' | 'SKIPPED' | 'BLOCKED'> = {
    'passed': 'PASSED',
    'failed': 'FAILED',
    'skipped': 'SKIPPED',
    'timedOut': 'BLOCKED',
    'interrupted': 'BLOCKED'
  };
  
  const status = testInfo.status ? statusMap[testInfo.status] || 'SKIPPED' : 'SKIPPED';
  
  // Capture screenshot on failure
  let screenshotBuffer: Buffer | undefined;
  if (status === 'FAILED') {
    try {
      screenshotBuffer = await page.screenshot({ fullPage: true });
      console.log('📸 Captured screenshot for failed test');
    } catch (screenshotError) {
      console.log('⚠️ Could not capture screenshot:', screenshotError);
    }
  }
  
  try {
    // Prepare test data
    const testData = {
      url: page.url(),
      title: await page.title(),
      environment: config.ENV,
      baseUrl: config.BASE_URL,
      testStartTime: testStartTime?.toISOString(),
      testEndTime: new Date().toISOString(),
      testTitle: testInfo.title,
      testStatus: status,
      testDuration: testInfo.duration
    };
    
    // Save test result
    await resultsHandler.saveTestCaseResult(
      testInfo.title,
      status,
      {
        error: testInfo.error?.message,
        stackTrace: testInfo.error?.stack,
        duration: testInfo.duration,
        browser: testInfo.project?.name || 'chromium',
        environment: config.ENV,
        tags: testInfo.tags ? Array.from(testInfo.tags) : [],
        screenshot: screenshotBuffer,
        testData,
        url: page.url()
      }
    );
    
    console.log(`✅ Result saved for: ${testInfo.title}`);
    
    // Clean up start time entry
    testStartTimes.delete(testInfo.title);
    
  } catch (error) {
    console.error('❌ Error saving test result:', error);
    
    // Emergency logging
    try {
      const logPath = path.join('test-results', 'error-log.txt');
      fs.appendFileSync(logPath, 
        `${new Date().toISOString()} | ${testInfo.title} | ${error}\n`, 
        { flag: 'a' }
      );
    } catch (logError) {
      console.error('💥 Emergency logging also failed:', logError);
    }
  }
  
  console.log(`🏁 Finished test: ${testInfo.title}\n`);
});

// ==================== TEST CASES ====================

testWithResults('LoginTest - Valid Login with Environment Credentials', {
  tag: ['@Login', '@Authentication', '@Smoke']
}, async ({ page }) => {
  console.log('🔐 Testing valid login with environment credentials...');
  
  // Navigate to login page
  await page.goto(config.BASE_URL);
  console.log(`🌐 Navigated to: ${config.BASE_URL}`);
  
  // Validate login page elements
  console.log('🔍 Validating login page elements...');
  
  // Check page title
  await expect(page).toHaveTitle(/OrangeHRM/);
  console.log('✅ Page title contains "OrangeHRM"');
  
  // Check logo is visible
  const logo = page.locator('div.orangehrm-login-branding');
  await expect(logo).toBeVisible();
  console.log('✅ Logo is visible');
  
  // Check login form elements
  const usernameField = page.locator('input[name="username"]');
  const passwordField = page.locator('input[name="password"]');
  const loginButton = page.locator('button[type="submit"]');
  
  await expect(usernameField).toBeVisible();
  await expect(passwordField).toBeVisible();
  await expect(loginButton).toBeVisible();
  console.log('✅ All login form elements are present');
  
  // Fill login form with environment variables
  console.log(`👤 Entering username: ${config.USERNAME}`);
  await usernameField.fill(config.USERNAME);
  
  console.log(`🔒 Entering password: ${'*'.repeat(config.PASSWORD.length)}`);
  await passwordField.fill(config.PASSWORD);
  
  // Click login button
  console.log('🖱️ Clicking login button...');
  await loginButton.click();
  
  // Wait for navigation
  await page.waitForURL('**/dashboard/index**', { timeout: config.TIMEOUT });
  console.log('✅ Successfully navigated to dashboard');
  
  // Verify successful login
  console.log('🔍 Verifying successful login...');
  
  // Check dashboard URL
  const currentUrl = page.url();
  expect(currentUrl).toContain('/dashboard/index');
  console.log(`✅ Dashboard URL: ${currentUrl}`);
  
  // Check dashboard title
  await expect(page).toHaveTitle(/OrangeHRM/);
  console.log('✅ Page title contains "Dashboard"');
  
  // Check user dropdown/menu is visible
  const userDropdown = page.locator('.oxd-userdropdown-tab');
  await expect(userDropdown).toBeVisible();
  console.log('✅ User dropdown is visible (logged in state)');
  
  // Check dashboard header
  const dashboardHeader = page.locator('h6:has-text("Dashboard")');
  await expect(dashboardHeader).toBeVisible();
  console.log('✅ Dashboard header is visible');
  
  console.log('🎉 Login test completed successfully!');
});

// ... rest of your test cases remain the same ...

testWithResults.afterAll(async ({ resultsHandler }) => {
  console.log('\n' + '='.repeat(60));
  console.log('🏁 OrangeHRM Login Test Suite Completed');
  console.log('='.repeat(60));
  
  // Generate summary report
  try {
    const summaryPath = path.join('test-results', 'test-summary.txt');
    const summary = `
OrangeHRM Test Execution Summary
===============================
Generated: ${new Date().toISOString()}
Environment: ${config.ENV}
Base URL: ${config.BASE_URL}
Test Suite: Login Authentication

📁 Results stored in: ${path.resolve('test-results')}
📊 View individual test results in: test-results/suites/Authentication/

For detailed reports, run:
- npm run report (for HTML report)
- Check test-results/suites/ folder for individual test results

===========================================================
    `;
    
    fs.writeFileSync(summaryPath, summary);
    console.log(`📄 Summary report saved: ${summaryPath}`);
  } catch (error) {
    console.log('⚠️ Could not create summary report:', error);
  }
  
  console.log('🎉 All tests completed! Check test-results folder for detailed reports.');
  console.log('='.repeat(60));
});