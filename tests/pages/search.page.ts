import { type Locator, type Page } from "@playwright/test";

export class SearchPage {
  constructor(private readonly page: Page) {}

  private searchInput(): Locator {
    return this.page.locator('input[data-test="search-input"]');
  }

  private searchReady(): Locator {
    return this.page.locator('[data-test="search-switch"].loaded');
  }

  private cookieAcceptButton(): Locator {
    return this.page
      .getByRole("button", { name: /\b(?:accept|agree|allow all)\b/i })
      .filter({ visible: true })
      .first();
  }

  firstIcon(): Locator {
    return this.page.locator('a.app-grid-icon[data-test="grid-icon"]').first();
  }

  firstIconImage(): Locator {
    return this.firstIcon().locator("img").first();
  }

  heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  async open(): Promise<void> {
    await this.page.goto("/");
  }

  async closeCookieBanner(): Promise<void> {
    // Баннер может появиться вместе с поздней догрузкой поиска, а не сразу после открытия.
    await this.searchReady().waitFor();
    const accept = this.cookieAcceptButton();
    if (await accept.isVisible()) {
      await accept.click();
    }
  }

  async search(query: string): Promise<void> {
    const input = this.searchInput();
    // Поле есть сразу, но поиск начинает слушать ввод только когда блок рядом догрузился.
    // Иначе буквы стираются, и Enter ничего не ищет.
    await this.searchReady().waitFor();
    await input.click();
    await input.pressSequentially(query);
    await input.press("Enter");
  }

  async isFirstIconImageLoaded(): Promise<boolean> {
    return this.firstIconImage().evaluate((img) => {
      if (!("complete" in img) || !("naturalWidth" in img)) {
        return false;
      }

      const image = img as { complete: boolean; naturalWidth: number };
      return image.complete && image.naturalWidth > 0;
    });
  }
}
