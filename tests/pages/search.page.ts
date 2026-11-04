import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

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

  firstIconTitle(): Locator {
    return this.firstIcon().locator('[data-test="grid-icon-title"]');
  }

  openedIconName(): Locator {
    // Ссылка на открытую иконку. Класс вёрстки вокруг неё не используем.
    return this.page.locator('[data-test="i8-link"][href^="/icon/"]');
  }

  heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  private searchDropdown(): Locator {
    return this.page.locator('[data-test="search-dropdown"]');
  }

  firstSuggestion(): Locator {
    return this.searchDropdown().locator('[data-test="search-suggest-result-link"]').first();
  }

  private staticIconsButton(): Locator {
    // Кнопка фильтра рядом с Animated. Другие кнопки Static — это стиль и вкладка карточки.
    return this.page
      .getByRole("button", { name: "Animated", exact: true })
      .locator("..")
      .getByRole("button", { name: "Static", exact: true });
  }

  downloadButton(): Locator {
    // Один и тот же data-test стоит на многих кнопках. На карточке надпись Download...
    return this.page.locator('[data-test="i8-button"]').filter({ hasText: /^Download\.\.\./ });
  }

  private downloadForm(): Locator {
    return this.page.locator('[data-test="i8-modal"]');
  }

  private pngFormat(): Locator {
    return this.downloadForm().locator('[data-test="format"]').filter({ hasText: /^PNG/ });
  }

  smallPngSize(): Locator {
    return this.downloadForm().getByRole("checkbox", { name: /^50×50/ });
  }

  private confirmDownloadButton(): Locator {
    // В форме есть ещё ссылка Edit in Lunacy с тем же data-test. Нужна кнопка Download.
    return this.downloadForm().locator('button[data-test="i8-button"]').filter({ hasText: /^\s*Download\s*$/ });
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
    await this.typeQuery(query);
    await this.searchInput().press("Enter");
  }

  async typeQuery(query: string): Promise<void> {
    const input = this.searchInput();
    // Поле есть сразу, но поиск начинает слушать ввод только когда блок рядом догрузился.
    // Иначе буквы стираются, и подсказки не появляются.
    await this.searchReady().waitFor();
    await input.click();
    await input.pressSequentially(query);
  }

  async clickFirstSuggestion(): Promise<void> {
    await this.firstSuggestion().click();
  }

  async chooseStaticIcons(): Promise<void> {
    await this.staticIconsButton().click();
    await this.page.waitForURL(/--static(?:[?#].*)?$/);
  }

  async clickFirstIcon(): Promise<void> {
    await this.firstIcon().click();
  }

  async checkDownloadButtonClickable(): Promise<void> {
    // Проверка, что по кнопке можно нажать. Сам файл при этом не скачивается.
    await this.downloadButton().click({ trial: true });
  }

  async openDownloadForm(): Promise<void> {
    await this.downloadButton().click();
  }

  async choosePngFormat(): Promise<void> {
    // PNG уже выбран при открытии. Повторный клик выбор не снимает, в отличие от размера.
    await this.pngFormat().click();
  }

  async chooseSmallPngSize(): Promise<void> {
    const size = this.smallPngSize();
    // Размер 50×50 уже может быть включён. Повторный клик снял бы выбор.
    if ((await size.getAttribute("aria-checked")) !== "true") {
      await size.click();
    }
  }

  async savePngDownload(): Promise<{ name: string; size: number }> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.confirmDownloadButton().click(),
    ]);
    const name = download.suggestedFilename();
    const target = path.join(process.cwd(), "downloads", name);
    await mkdir(path.dirname(target), { recursive: true });
    await download.saveAs(target);
    const file = await stat(target);
    return { name, size: file.size };
  }

  async isFirstIconStatic(): Promise<boolean> {
    return this.firstIconImage().evaluate((img) => {
      const sources = `${img.getAttribute("src") ?? ""} ${img.getAttribute("srcset") ?? ""}`;
      // Адреса склеены пробелом, поэтому .gif часто стоит не в конце строки.
      return sources.length > 0 && !/\.gif(?=[\s?#]|$)|format=gif/i.test(sources);
    });
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
