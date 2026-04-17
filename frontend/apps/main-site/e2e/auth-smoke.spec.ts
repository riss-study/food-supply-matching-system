import { expect, test } from "@playwright/test"

const SEED_REQUESTER = { email: "buyer@test.com", password: "Test1234!" }
const SEED_SUPPLIER = { email: "supplier@test.com", password: "Test1234!" }

test.describe("Auth flows", () => {
  test("requester can log in and reach dashboard", async ({ page }) => {
    await page.goto("/login")

    await page.getByPlaceholder("name@company.com").fill(SEED_REQUESTER.email)
    await page
      .getByPlaceholder("비밀번호를 입력하세요")
      .fill(SEED_REQUESTER.password)
    await page.getByRole("button", { name: "로그인" }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "시작 화면",
    )
    await expect(page.getByText(SEED_REQUESTER.email)).toBeVisible()
  })

  test("supplier can log in and reach dashboard with supplier guide text", async ({
    page,
  }) => {
    await page.goto("/login")

    await page.getByPlaceholder("name@company.com").fill(SEED_SUPPLIER.email)
    await page
      .getByPlaceholder("비밀번호를 입력하세요")
      .fill(SEED_SUPPLIER.password)
    await page.getByRole("button", { name: "로그인" }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByText(SEED_SUPPLIER.email)).toBeVisible()
    // dashboard guide paragraph (specific phrase, not header link)
    await expect(
      page.getByText(/의뢰 피드, 내 견적, 메시지 화면으로 이동해/),
    ).toBeVisible()
  })

  test("invalid credentials clear auth and bounce back to /login", async ({
    page,
  }) => {
    await page.goto("/login")

    await page.getByPlaceholder("name@company.com").fill("noone@example.com")
    await page
      .getByPlaceholder("비밀번호를 입력하세요")
      .fill("WrongPassword!1")
    await page.getByRole("button", { name: "로그인" }).click()

    // Interceptor on 401 clears auth and forces window.location -> /login
    // (full page reload). Wait for the bounce to settle.
    await page.waitForURL(/\/login$/)
    await expect(
      page.getByRole("heading", { name: "로그인" }),
    ).toBeVisible()
  })

  test("logout from dashboard returns to public state", async ({ page }) => {
    await page.goto("/login")
    await page.getByPlaceholder("name@company.com").fill(SEED_REQUESTER.email)
    await page
      .getByPlaceholder("비밀번호를 입력하세요")
      .fill(SEED_REQUESTER.password)
    await page.getByRole("button", { name: "로그인" }).click()
    await expect(page).toHaveURL(/\/dashboard$/)

    await page.getByRole("button", { name: "로그아웃" }).first().click()

    // After logout, header should expose 로그인 link again
    await expect(
      page.getByRole("link", { name: "로그인" }).first(),
    ).toBeVisible()
  })
})
