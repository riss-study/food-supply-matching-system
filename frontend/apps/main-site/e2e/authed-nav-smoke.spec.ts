import { expect, test, type Page } from "@playwright/test"

const SEED_REQUESTER = { email: "buyer@test.com", password: "Test1234!" }
const SEED_SUPPLIER = { email: "supplier@test.com", password: "Test1234!" }

async function login(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.getByPlaceholder("name@company.com").fill(email)
  await page.getByPlaceholder("비밀번호를 입력하세요").fill(password)
  await page.getByRole("button", { name: "로그인" }).click()
  await page.waitForURL(/\/dashboard$/)
}

test.describe("Authenticated requester pages render", () => {
  test("requester reaches request list page", async ({ page }) => {
    await login(page, SEED_REQUESTER.email, SEED_REQUESTER.password)
    await page.getByRole("link", { name: "내 의뢰" }).first().click()
    await expect(page).toHaveURL(/\/requests$/)
    await expect(
      page.getByRole("heading", { name: "내 의뢰 목록" }),
    ).toBeVisible()
  })

  test("requester reaches messages page", async ({ page }) => {
    await login(page, SEED_REQUESTER.email, SEED_REQUESTER.password)
    await page.getByRole("link", { name: "메시지" }).first().click()
    await expect(page).toHaveURL(/\/threads$/)
    await expect(
      page.getByRole("heading", { name: "메시지" }).first(),
    ).toBeVisible()
  })

  test("supplier reaches request feed page", async ({ page }) => {
    await login(page, SEED_SUPPLIER.email, SEED_SUPPLIER.password)
    await page.getByRole("link", { name: "의뢰 피드" }).first().click()
    await expect(page).toHaveURL(/\/supplier\/requests$/)
    await expect(
      page.getByRole("heading", { name: "의뢰 피드" }),
    ).toBeVisible()
  })

  test("supplier reaches my quotes page", async ({ page }) => {
    await login(page, SEED_SUPPLIER.email, SEED_SUPPLIER.password)
    await page.getByRole("link", { name: "내 견적" }).first().click()
    await expect(page).toHaveURL(/\/supplier\/quotes$/)
    await expect(
      page.getByRole("heading", { name: "내 견적 관리" }),
    ).toBeVisible()
  })

  test("supplier reaches messages page", async ({ page }) => {
    await login(page, SEED_SUPPLIER.email, SEED_SUPPLIER.password)
    await page.getByRole("link", { name: "메시지" }).first().click()
    await expect(page).toHaveURL(/\/threads$/)
    await expect(
      page.getByRole("heading", { name: "메시지" }).first(),
    ).toBeVisible()
  })
})
