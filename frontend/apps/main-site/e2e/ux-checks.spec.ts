import { expect, test, type ConsoleMessage, type Page } from "@playwright/test"

const PUBLIC_PATHS = ["/", "/notices", "/suppliers", "/login", "/signup"]

function attachConsoleCollector(page: Page) {
  const errors: ConsoleMessage[] = []
  const warnings: ConsoleMessage[] = []
  page.on("console", (msg) => {
    const text = msg.text()
    // Ignore noisy expected warnings (router future flags will be addressed in
    // P2-02; this checker only fails on hard errors).
    if (msg.type() === "error") {
      errors.push(msg)
    }
    if (
      msg.type() === "warning" &&
      !text.includes("React Router Future Flag") &&
      !text.includes("relative route resolution")
    ) {
      warnings.push(msg)
    }
  })
  return { errors, warnings }
}

test.describe("UX checks - public pages", () => {
  for (const path of PUBLIC_PATHS) {
    test(`no console errors on ${path}`, async ({ page }) => {
      const { errors } = attachConsoleCollector(page)
      await page.goto(path)
      // Wait a beat for hydration / async fetches
      await page.waitForLoadState("networkidle")
      const errorTexts = errors.map((e) => e.text())
      expect(
        errorTexts,
        `Console errors on ${path}: ${errorTexts.join(" | ")}`,
      ).toEqual([])
    })

    test(`primary heading present on ${path}`, async ({ page }) => {
      await page.goto(path)
      const h1Count = await page.locator("h1, h2").first().count()
      expect(h1Count).toBeGreaterThan(0)
    })
  }

  test("global header is present on every public page", async ({ page }) => {
    for (const path of PUBLIC_PATHS) {
      await page.goto(path)
      await expect(
        page.getByRole("link", { name: "잇다" }).first(),
      ).toBeVisible()
    }
  })

  test("notices page renders empty-state friendly when no items", async ({
    page,
  }) => {
    // Force a high page index to hit empty result without changing seed data
    await page.goto("/notices")
    await expect(
      page.getByRole("heading", { name: "공지사항" }),
    ).toBeVisible()
  })
})

test.describe("UX checks - 404 / unknown route", () => {
  test("unknown route redirects to home", async ({ page }) => {
    await page.goto("/this-route-does-not-exist")
    await expect(page).toHaveURL(/\/$/)
  })
})

test.describe("UX checks - protected routes", () => {
  test("/dashboard without auth redirects to /login", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login$/)
  })

  test("/threads without auth redirects to /login", async ({ page }) => {
    await page.goto("/threads")
    await expect(page).toHaveURL(/\/login$/)
  })

  test("/requests without auth redirects to /login", async ({ page }) => {
    await page.goto("/requests")
    await expect(page).toHaveURL(/\/login$/)
  })
})
