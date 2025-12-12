import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { config } from '../config/environment';

export class LoginPage extends BasePage {
  // Locators
  private readonly usernameInput = 'input[name="username"]';
  private readonly passwordInput = 'input[name="password"]';
  private readonly loginButton = 'button[type="submit"]';
  private readonly logo = 'div.orangehrm-login-branding';
  private readonly errorMessage = '.oxd-alert-content';
  private readonly forgotPasswordLink = '.orangehrm-login-forgot';

  constructor(page: Page) {
    super(page);
  }

  async navigate(): Promise<void> {
    await this.navigateTo(config.BASE_URL);
  }

  async validateLoginPage(): Promise<void> {
    console.log('Validating login page elements...');
    
    // Check page title
    await expect(this.page).toHaveTitle(/OrangeHRM/);
    console.log('Page title contains "OrangeHRM"');
    
    // Check logo
    await expect(this.page.locator(this.logo)).toBeVisible();
    console.log('Logo is visible');
    
    // Check form elements
    await expect(this.page.locator(this.usernameInput)).toBeVisible();
    await expect(this.page.locator(this.passwordInput)).toBeVisible();
    await expect(this.page.locator(this.loginButton)).toBeVisible();
    console.log('All login form elements are present');
  }

  async login(username: string = config.USERNAME1, password: string = config.PASSWORD1): Promise<void> {
    console.log(`Logging in with username: ${username}`);
    
    await this.fillField(this.usernameInput, username);
    await this.fillField(this.passwordInput, password);
    await this.clickButton(this.loginButton);
    
    // Wait for navigation to dashboard
    await this.page.waitForURL('**/dashboard/index**', { timeout: config.TIMEOUT });
    console.log('Successfully logged in and navigated to dashboard');
  }

  async loginWithInvalidCredentials(username: string = 'InvalidUser', password: string = 'WrongPassword123'): Promise<void> {
    console.log(`Attempting login with invalid credentials...`);
    
    await this.fillField(this.usernameInput, username);
    await this.fillField(this.passwordInput, password);
    await this.clickButton(this.loginButton);
    
    // Wait for error message
    await this.page.waitForSelector(this.errorMessage, { timeout: 5000 });
    
    const errorLocator = this.page.locator(this.errorMessage);
    await expect(errorLocator).toBeVisible();
    await expect(errorLocator).toContainText('Invalid credentials');
    console.log('Invalid credentials error displayed correctly');
  }

  async attemptLoginWithoutCredentials(): Promise<void> {
    console.log('Attempting login without credentials...');
    
    await this.clickButton(this.loginButton);
    
    // Check for required field messages
    const requiredFields = this.page.locator('.oxd-input-field-error-message');
    await expect(requiredFields).toHaveCount(2);
    console.log('Required field validations are displayed');
  }

  async isLoginPage(): Promise<boolean> {
    return await this.page.url().includes('/auth/login') && 
           await this.isElementVisible(this.loginButton);
  }
}