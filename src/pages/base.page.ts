import { Page, Locator } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  // Common methods for all pages
  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url);
    console.log(`🌐 Navigated to: ${url}`);
  }

  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  async takeScreenshot(name: string): Promise<Buffer> {
    return await this.page.screenshot({ 
      fullPage: true,
      path: `test-results/screenshots/${name}-${Date.now()}.png`
    });
  }

  async waitForElement(selector: string, timeout: number = 30000): Promise<Locator> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    return locator;
  }

  async fillField(selector: string, value: string): Promise<void> {
    const field = this.page.locator(selector);
    await field.fill(value);
    console.log(`📝 Filled ${selector}: ${value}`);
  }

  async clickButton(selector: string): Promise<void> {
    const button = this.page.locator(selector);
    await button.click();
    console.log(`🖱️ Clicked: ${selector}`);
  }

  async isElementVisible(selector: string): Promise<boolean> {
    try {
      return await this.page.locator(selector).isVisible();
    } catch {
      return false;
    }
  }
}