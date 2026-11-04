import { expect, test } from "@playwright/test";

import { SearchPage } from "./pages/search.page";

test("поиск cat показывает иконки и заголовок", async ({ page }) => {
  const search = new SearchPage(page);

  await search.open();
  await search.closeCookieBanner();
  await search.search("cat");

  // Путь должен заканчиваться на /cat. Кусок в середине, как в /category, не подходит.
  await expect(page).toHaveURL(/\/cat(?:[?#].*)?$/);
  await expect(search.firstIcon()).toBeVisible();
  await expect(search.firstIconImage()).toBeVisible();
  await expect.poll(() => search.isFirstIconImageLoaded()).toBe(true);
  await expect(search.heading()).toContainText(/cat/i);
});
