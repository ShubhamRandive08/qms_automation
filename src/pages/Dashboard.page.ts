import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class DashboardPage extends BasePage {
  // Locators
  private readonly userDropdown = '.oxd-userdropdown-tab';
  private readonly logoutButton = 'a:has-text("Logout")';
  private readonly dashboardHeader = 'h6:has-text("Dashboard")';
  private readonly dashboardTitle = '.oxd-topbar-header-title';

  constructor(page: Page) {
    super(page);
  }

  async validateDashboard(): Promise<void> {
    console.log('Validating dashboard elements...');
    
    // Check URL
    expect(this.page.url()).toContain('/dashboard/index');
    console.log(`Dashboard URL: ${this.page.url()}`);
    
    // Check title
    await expect(this.page).toHaveTitle(/OrangeHRM/);
    console.log('Page title contains "OrangeHRM"');
    
    // Check user dropdown
    await expect(this.page.locator(this.userDropdown)).toBeVisible();
    console.log('User dropdown is visible (logged in state)');
    
    // Check dashboard header
    await expect(this.page.locator(this.dashboardHeader)).toBeVisible();
    console.log(' Dashboard header is visible');

  }

  async logout(): Promise<void> {
    console.log('Logging out...');
    
    await this.clickButton(this.userDropdown);
    await this.clickButton(this.logoutButton);
    
    // Wait for redirect to login page
    await this.page.waitForURL('**/auth/login**');
    
    // Verify we're back on login page
    await expect(this.page.locator('button[type="submit"]')).toBeVisible();
    console.log('Logout successful, redirected to login page');
  }

  async isDashboardVisible(): Promise<boolean> {
    return await this.isElementVisible(this.dashboardHeader) && 
           await this.page.url().includes('/dashboard');
  }
}