import { defineConfig, devices } from "@playwright/test";

try {
  process.loadEnvFile();
} catch {
  // Файла .env нет. Адрес сайта берётся из значения ниже.
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 2,
  reporter: "html",
  use: {
    ...devices["Desktop Chrome"],
    // Окно Chrome на весь экран. Фиксированный размер страницы этому мешает.
    viewport: null,
    deviceScaleFactor: undefined,
    launchOptions: {
      args: ["--start-maximized"],
    },
    baseURL: process.env.URL ?? "https://icons8.com",
    channel: "chrome",
    headless: false,
    trace: "on",
  },
});
