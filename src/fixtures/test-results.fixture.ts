import { test as baseTest } from '@playwright/test';
import { TestResultsHandler } from '../utils/testResultHandler';
import { config } from '../config/environment';
import * as fs from 'fs';
import * as path from 'path';

// Store test start times
const testStartTimes = new Map<string, Date>();

// Define what our fixture will provide
export type TestResultsFixture = {
  resultsHandler: TestResultsHandler;
};

// Extend base test with our fixture
export const test = baseTest.extend<TestResultsFixture>({
  resultsHandler: async ({}, use) => {
    const handler = new TestResultsHandler('test-results', 'OrangeHRM-Tests', '1.0.0');
    await use(handler);
  },
});

// Add global hooks for results handling
test.beforeAll(() => {
  console.log('='.repeat(60));
  console.log('🚀 Starting Test Execution');
  console.log('='.repeat(60));
  console.log(`🌐 Environment: ${config.ENV}`);
  console.log(`🔗 Base URL: ${config.BASE_URL}`);
  console.log(`⚡ Headless: ${config.HEADLESS}`);
  console.log(`⏱️ Timeout: ${config.TIMEOUT}ms`);
  console.log('='.repeat(60));
});

test.beforeEach(async ({}, testInfo) => {
  console.log(`\n▶️ Starting test: ${testInfo.title}`);
  console.log(`🏷️ Tags: ${Array.from(testInfo.tags).join(', ') || 'None'}`);
  
  // Store start time
  testStartTimes.set(testInfo.title, new Date());
});

test.afterEach(async ({ page, resultsHandler }, testInfo) => {
  console.log(`\n📊 Test completed: ${testInfo.title}`);
  console.log(`📈 Status: ${testInfo.status}`);
  console.log(`⏱️ Duration: ${testInfo.duration}ms`);
  
  // Get start time from our map
  const testStartTime = testStartTimes.get(testInfo.title);
  
  // Map Playwright status to our status types
  const status = getTestStatus(testInfo.status);
  
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

test.afterAll(async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Test Suite Completed');
  console.log('='.repeat(60));
  
  // Generate summary report
  try {
    const summaryPath = path.join('test-results', 'test-summary.txt');
    const summary = `
Test Execution Summary
=====================
Generated: ${new Date().toISOString()}
Environment: ${config.ENV}
Base URL: ${config.BASE_URL}

📁 Results stored in: ${path.resolve('test-results')}
📊 View individual test results in: test-results/suites/

For detailed reports, run:
- npm run report (for HTML report)
- Check test-results/suites/ folder for individual test results

=================================================
    `;
    
    fs.writeFileSync(summaryPath, summary);
    console.log(`📄 Summary report saved: ${summaryPath}`);
  } catch (error) {
    console.log('⚠️ Could not create summary report:', error);
  }
  
  console.log('🎉 All tests completed! Check test-results folder for detailed reports.');
  console.log('='.repeat(60));
});

// Helper function to map Playwright status to our status types
function getTestStatus(playwrightStatus?: string): 'PASSED' | 'FAILED' | 'SKIPPED' | 'BLOCKED' {
  const statusMap: Record<string, 'PASSED' | 'FAILED' | 'SKIPPED' | 'BLOCKED'> = {
    'passed': 'PASSED',
    'failed': 'FAILED',
    'skipped': 'SKIPPED',
    'timedOut': 'BLOCKED',
    'interrupted': 'BLOCKED'
  };
  
  return playwrightStatus ? statusMap[playwrightStatus] || 'SKIPPED' : 'SKIPPED';
}

// Export expect for consistency
export const expect = test.expect;