import { defineConfig, devices } from "@playwright/test";
import { randomUUID } from "node:crypto";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("Invalid Playwright port");
const dev = process.env.PLAYWRIGHT_DEV === "1";
const baseURL = `http://localhost:${port}`;
// Ephemeral synthetic test credentials, never real user configuration.
process.env.PRACTICUM_TEST_EMAIL ??= "browser-lab@example.invalid";
process.env.PRACTICUM_TEST_PASSWORD ??= randomUUID();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: {
    command: `node node_modules/next/dist/bin/next ${dev ? "dev" : "start"} --hostname localhost --port ${port}`,
    url: baseURL,
    env: {
      DEMO_EMAIL: process.env.PRACTICUM_TEST_EMAIL,
      DEMO_PASSWORD: process.env.PRACTICUM_TEST_PASSWORD,
    },
    reuseExistingServer: false,
    timeout: 120000,
  },
});
