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

test("поиск dog открывает статичную иконку и скачивает маленький PNG", async ({ page }) => {
  const search = new SearchPage(page);

  await search.open();
  await search.closeCookieBanner();
  await search.typeQuery("dog");
  // Первая подсказка должна быть ровно этим словом: dogs и hotdog не подходят.
  await expect(search.firstSuggestion()).toHaveText("dog");
  await search.clickFirstSuggestion();
  await search.chooseStaticIcons();
  await expect.poll(() => search.isFirstIconStatic()).toBe(true);

  const iconName = (await search.firstIconTitle().innerText()).trim();
  await search.clickFirstIcon();
  await expect(search.openedIconName()).toHaveText(iconName);

  const download = search.downloadButton();
  await expect(download).toBeVisible();
  await expect(download).toBeEnabled();
  await search.checkDownloadButtonClickable();

  await search.openDownloadForm();
  await search.choosePngFormat();
  await search.chooseSmallPngSize();
  await expect(search.smallPngSize()).toBeChecked();
  const file = await search.savePngDownload();

  expect(file.name.endsWith(".png")).toBe(true);
  expect(file.size).toBeGreaterThan(0);
});

test("поиск car и фильтр Windows показывает иконку", async ({ page }) => {
  const search = new SearchPage(page);

  await search.open();
  await search.closeCookieBanner();
  await search.typeQuery("car");
  await expect(search.carSuggestion()).toHaveText("car");
  await search.clickCarSuggestion();
  // Сначала стабильная выдача car. Иконка с прошлой страницы за результат фильтра не считается.
  await expect(page).toHaveURL(/\/car(?:[?#].*)?$/);
  await expect(search.firstIcon()).toBeVisible();
  await expect.poll(() => search.isFirstIconImageLoaded()).toBe(true);

  // Пустую сетку ловим с клика. Имя иконки не сверяем: после паузы список собирается заново.
  const gridCleared = search.waitForGridToClear();
  await search.chooseWindows();
  await expect(page).toHaveURL(/\/car--os-windows(?:[?#].*)?$/);
  await gridCleared;
  await expect(search.firstIcon()).toBeVisible();
  await expect(search.firstIconImage()).toBeVisible();
  await expect.poll(() => search.isFirstIconImageLoaded()).toBe(true);
});
