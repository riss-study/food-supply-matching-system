import { expect, test } from "@playwright/test"

const SEED_ADMIN = { email: "admin@test.com", password: "Test1234!" }

test.describe("Admin smoke flows", () => {
  test("unauthenticated visit redirects to /login", async ({ page }) => {
    await page.goto("/reviews")
    await expect(page).toHaveURL(/\/login$/)
    await expect(
      page.getByRole("heading", { name: "관리자 로그인" }),
    ).toBeVisible()
  })

  test("admin can log in and reach review queue", async ({ page }) => {
    await page.goto("/login")

    await page.getByPlaceholder("admin@itda.co.kr").fill(SEED_ADMIN.email)
    await page.getByPlaceholder("비밀번호").fill(SEED_ADMIN.password)
    await page.getByRole("button", { name: "로그인" }).click()

    await expect(page).toHaveURL(/\/reviews$/)
  })

  test("admin login with invalid credentials surfaces error", async ({
    page,
  }) => {
    await page.goto("/login")

    await page.getByPlaceholder("admin@itda.co.kr").fill("nope@example.com")
    await page.getByPlaceholder("비밀번호").fill("WrongPassword!1")
    await page.getByRole("button", { name: "로그인" }).click()

    // After 401, interceptor should send us back to /login
    await page.waitForURL(/\/login$/)
    await expect(
      page.getByRole("heading", { name: "관리자 로그인" }),
    ).toBeVisible()
  })

  test("non-admin user cannot log into admin-site", async ({ page }) => {
    await page.goto("/login")
    await page.getByPlaceholder("admin@itda.co.kr").fill("buyer@test.com")
    await page.getByPlaceholder("비밀번호").fill("Test1234!")
    await page.getByRole("button", { name: "로그인" }).click()

    // expect we do not reach /reviews; admin-server should reject non-admin
    await page.waitForURL(/\/login$/)
    await expect(
      page.getByRole("heading", { name: "관리자 로그인" }),
    ).toBeVisible()
  })
})
