import { defineConfig, devices } from "@playwright/test"

const mainBaseURL = process.env.E2E_MAIN_BASE_URL ?? "http://localhost:5173"
const adminBaseURL = process.env.E2E_ADMIN_BASE_URL ?? "http://localhost:5174"
const reuseServer = !process.env.CI

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",

  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "main-site",
      testIgnore: /admin-[^/]*\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"], baseURL: mainBaseURL },
    },
    {
      name: "admin-site",
      testMatch: /admin-[^/]*\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"], baseURL: adminBaseURL },
    },
  ],

  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : [
        {
          command: "yarn dev",
          url: mainBaseURL,
          reuseExistingServer: reuseServer,
          timeout: 120_000,
        },
        {
          command: "yarn workspace @fsm/admin-site dev",
          cwd: "../../",
          url: adminBaseURL,
          reuseExistingServer: reuseServer,
          timeout: 120_000,
        },
      ],
})
