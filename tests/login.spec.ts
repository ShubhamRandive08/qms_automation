import { test, expect } from '../src/fixtures/test-results.fixture';
import { LoginPage } from '../src/pages/Login.page'; // lowercase 'l'
import { DashboardPage } from '../src/pages/Dashboard.page';
import { config } from '../src/config/environment';

test.describe('OrangeHRM Login Tests', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test('Valid Login with Environment Credentials', {
    tag: ['@Login', '@Authentication', '@Smoke']
  }, async ({ page }) => {
    // Navigate and validate login page
    await loginPage.navigate();
    await loginPage.validateLoginPage();
    
    // Perform login
    await loginPage.login();
    
    // Validate successful login
    await dashboardPage.validateDashboard();
  });

  test('Invalid Login with Wrong Credentials', {
    tag: ['@Login', '@Authentication', '@Negative']
  }, async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginWithInvalidCredentials();
  });

  test('Empty Login Form Validation', {
    tag: ['@Login', '@Validation']
  }, async ({ page }) => {
    await loginPage.navigate();
    await loginPage.attemptLoginWithoutCredentials();
  });

  test('Logout Functionality', {
    tag: ['@Login', '@Authentication', '@Smoke']
  }, async ({ page }) => {
    // Login first
    await loginPage.navigate();
    await loginPage.login();
    await dashboardPage.validateDashboard();
    
    // Then logout
    await dashboardPage.logout();
    
    // Verify back on login page
    expect(await loginPage.isLoginPage()).toBe(true);
  });

  test('Login with Different User Roles', {
    tag: ['@Login', '@DataDriven']
  }, async ({ page }) => {
    // Example of data-driven testing
    const testUsers = [
      { username: config.USERNAME1, password: config.PASSWORD1, role: 'Admin' },
      // Add more test users as needed
    ];
    
    for (const user of testUsers) {
      console.log(`Testing login for role: ${user.role}`);
      
      await loginPage.navigate();
      await loginPage.login(user.username, user.password);
      await dashboardPage.validateDashboard();
      
      // Logout before next test
      await dashboardPage.logout();
    }
  });
});