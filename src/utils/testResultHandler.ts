import * as fs from 'fs';
import * as path from 'path';

export interface TestResult {
  testId: string;
  testName: string;
  testSuite: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'BLOCKED';
  error?: string;
  stackTrace?: string;
  duration: number;
  timestamp: string;
  browser: string;
  environment: string;
  tags: string[];
  screenshotPath?: string;
  testData?: Record<string, any>;
  url?: string;
}

export class TestResultsHandler {
  private baseResultsPath: string;
  private projectName: string;
  private version: string;

  constructor(
    basePath: string = 'test-results',
    projectName: string = 'OrangeHRM-Automation',
    version: string = '1.0.0'
  ) {
    this.baseResultsPath = basePath;
    this.projectName = projectName;
    this.version = version;
    
    this.ensureDirectoryExists(this.baseResultsPath);
    console.log(`📂 TestResultsHandler initialized at: ${path.resolve(this.baseResultsPath)}`);
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private sanitizeTestName(testName: string): string {
    return testName
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase()
      .substring(0, 100);
  }

  private extractTestSuite(testName: string): string {
    if (testName.toLowerCase().includes('login')) return 'Authentication';
    if (testName.toLowerCase().includes('dashboard')) return 'Dashboard';
    if (testName.toLowerCase().includes('admin')) return 'Administration';
    if (testName.toLowerCase().includes('validate')) return 'Validation';
    return 'General';
  }

  async saveTestCaseResult(
    testName: string,
    status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'BLOCKED',
    options: {
      error?: string;
      stackTrace?: string;
      duration?: number;
      browser?: string;
      environment?: string;
      tags?: string[];
      screenshot?: Buffer | string;
      testData?: Record<string, any>;
      url?: string;
    } = {}
  ): Promise<string> {
    try {
      console.log(`💾 Saving result for: ${testName} (${status})`);
      
      const suiteName = this.extractTestSuite(testName);
      const sanitizedName = this.sanitizeTestName(testName);
      
      // Create folder structure
      const suiteFolder = path.join(this.baseResultsPath, 'suites', suiteName);
      const testFolder = path.join(suiteFolder, sanitizedName);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const executionFolder = path.join(testFolder, timestamp);
      
      this.ensureDirectoryExists(suiteFolder);
      this.ensureDirectoryExists(testFolder);
      this.ensureDirectoryExists(executionFolder);
      
      // Create subfolders
      ['screenshots', 'logs', 'data'].forEach(subfolder => {
        this.ensureDirectoryExists(path.join(executionFolder, subfolder));
      });
      
      // Save screenshot if provided
      let screenshotPath: string | undefined;
      if (options.screenshot) {
        screenshotPath = path.join(executionFolder, 'screenshots', 'test-screenshot.png');
        if (typeof options.screenshot === 'string') {
          fs.writeFileSync(screenshotPath, Buffer.from(options.screenshot, 'base64'));
        } else {
          fs.writeFileSync(screenshotPath, options.screenshot);
        }
        console.log(`📸 Screenshot saved: ${screenshotPath}`);
      }
      
      // Create test result object
      const testResult: TestResult = {
        testId: `${suiteName}_${sanitizedName}_${Date.now()}`,
        testName,
        testSuite: suiteName,
        status,
        error: options.error,
        stackTrace: options.stackTrace,
        duration: options.duration || 0,
        timestamp: new Date().toISOString(),
        browser: options.browser || 'chromium',
        environment: options.environment || 'dev',
        tags: options.tags || [],
        screenshotPath,
        testData: options.testData,
        url: options.url
      };
      
      // Save as JSON
      const resultPath = path.join(executionFolder, 'test-result.json');
      fs.writeFileSync(resultPath, JSON.stringify(testResult, null, 2));
      
      // Save test data separately if provided
      if (options.testData) {
        const dataPath = path.join(executionFolder, 'data', 'test-data.json');
        fs.writeFileSync(dataPath, JSON.stringify(options.testData, null, 2));
      }
      
      // Update suite summary
      this.updateSuiteSummary(suiteName, testResult);
      
      console.log(`✅ Test result saved to: ${resultPath}`);
      return executionFolder;
      
    } catch (error) {
      console.error('❌ Error in saveTestCaseResult:', error);
      throw error;
    }
  }

  private updateSuiteSummary(suiteName: string, testResult: TestResult): void {
    const suiteFolder = path.join(this.baseResultsPath, 'suites', suiteName);
    this.ensureDirectoryExists(suiteFolder);
    
    const summaryPath = path.join(suiteFolder, 'suite-summary.json');
    let summary: any = {
      suiteName,
      lastUpdated: new Date().toISOString(),
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      blockedTests: 0,
      results: []
    };
    
    if (fs.existsSync(summaryPath)) {
      try {
        summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      } catch {
        // If file is corrupted, start fresh
      }
    }
    
    // Add new result
    summary.results.push({
      testName: testResult.testName,
      status: testResult.status,
      timestamp: testResult.timestamp,
      duration: testResult.duration
    });
    
    // Keep only last 50 results
    if (summary.results.length > 50) {
      summary.results = summary.results.slice(-50);
    }
    
    // Update counts
    summary.totalTests = summary.results.length;
    summary.passedTests = summary.results.filter((r: any) => r.status === 'PASSED').length;
    summary.failedTests = summary.results.filter((r: any) => r.status === 'FAILED').length;
    summary.skippedTests = summary.results.filter((r: any) => r.status === 'SKIPPED').length;
    summary.blockedTests = summary.results.filter((r: any) => r.status === 'BLOCKED').length;
    summary.lastUpdated = new Date().toISOString();
    
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  }
}