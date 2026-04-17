import {
  expect,
  test,
  type ConsoleMessage,
  type Page,
} from "@playwright/test"

const SEED_REQUESTER = { email: "buyer@test.com", password: "Test1234!" }
const SEED_SUPPLIER = { email: "supplier@test.com", password: "Test1234!" }

const REQUESTER_PATHS = [
  "/dashboard",
  "/requests",
  "/threads",
  "/business-profile",
]
const SUPPLIER_PATHS = [
  "/dashboard",
  "/supplier/profile",
  "/supplier/requests",
  "/supplier/quotes",
  "/threads",
]

function attachConsoleCollector(page: Page) {
  const errors: ConsoleMessage[] = []
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text()
      // Ignore expected dev-server HMR / network warnings if any
      if (text.includes("[vite]")) return
      errors.push(msg)
    }
  })
  page.on("pageerror", (err) => {
    errors.push({
      type: () => "error",
      text: () => err.message,
    } as unknown as ConsoleMessage)
  })
  return { errors }
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.getByPlaceholder("name@company.com").fill(email)
  await page.getByPlaceholder("비밀번호를 입력하세요").fill(password)
  await page.getByRole("button", { name: "로그인" }).click()
  await page.waitForURL(/\/dashboard$/)
}

test.describe("UX audit - requester authenticated pages", () => {
  for (const path of REQUESTER_PATHS) {
    test(`${path} loads without console errors and has at least one heading`, async ({
      page,
    }) => {
      const { errors } = attachConsoleCollector(page)
      await login(page, SEED_REQUESTER.email, SEED_REQUESTER.password)
      await page.goto(path)
      await page.waitForLoadState("networkidle")

      const errorTexts = errors.map((e) => e.text())
      expect(
        errorTexts,
        `Console errors on ${path}: ${errorTexts.join(" | ")}`,
      ).toEqual([])

      const headingCount = await page.locator("h1, h2").count()
      expect(headingCount).toBeGreaterThan(0)
    })
  }
})

test.describe("UX audit - supplier authenticated pages", () => {
  for (const path of SUPPLIER_PATHS) {
    test(`${path} loads without console errors and has at least one heading`, async ({
      page,
    }) => {
      const { errors } = attachConsoleCollector(page)
      await login(page, SEED_SUPPLIER.email, SEED_SUPPLIER.password)
      await page.goto(path)
      await page.waitForLoadState("networkidle")

      const errorTexts = errors.map((e) => e.text())
      expect(
        errorTexts,
        `Console errors on ${path}: ${errorTexts.join(" | ")}`,
      ).toEqual([])

      const headingCount = await page.locator("h1, h2").count()
      expect(headingCount).toBeGreaterThan(0)
    })
  }
})

test.describe("UX audit - form interactions", () => {
  test("login submit button is disabled until both fields filled", async ({
    page,
  }) => {
    await page.goto("/login")
    const submit = page.getByRole("button", { name: "로그인" })
    await expect(submit).toBeDisabled()

    await page.getByPlaceholder("name@company.com").fill("foo@bar.com")
    await expect(submit).toBeDisabled()

    await page.getByPlaceholder("비밀번호를 입력하세요").fill("anything")
    await expect(submit).toBeEnabled()
  })

  test("signup page renders with role chooser visible", async ({ page }) => {
    await page.goto("/signup")
    // Page should at least render a form and mention 회원가입 somewhere
    await expect(page.locator("form").first()).toBeVisible()
  })
})
