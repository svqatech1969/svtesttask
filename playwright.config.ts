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
    baseURL: process.env.URL ?? "https://icons8.com",
    channel: "chrome",
    headless: false,
    trace: "on",
  },
});
