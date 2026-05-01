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

    await expect(page).toHaveURL(/\/$/)
    // / 화면은 [로그인 사용자 시작 화면 (AuthenticatedHome)] + [마케팅 랜딩 (PublicLandingHome)] 이
    // 함께 렌더되므로 h1 이 둘 (시작 화면 + Hero). 시작 화면 헤딩만 정확히 매칭.
    await expect(
      page.getByRole("heading", { level: 1, name: /시작 화면/ }),
    ).toBeVisible()
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

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText(SEED_SUPPLIER.email)).toBeVisible()
    // dashboard surfaces supplier-specific shortcut card "의뢰 피드"
    // (heading 으로 검색해 헤더 nav link 와 구분)
    await expect(
      page.getByRole("heading", { name: "의뢰 피드" }),
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

    // 401 인터셉터는 더 이상 강제 reload 하지 않음 — /login 페이지에 그대로 머무르며
    // mutation.isError 로 에러 메시지를 표시한다.
    await expect(page).toHaveURL(/\/login$/)
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
    await expect(page).toHaveURL(/\/$/)

    await page.getByRole("button", { name: "로그아웃" }).first().click()

    // After logout, header should expose 로그인 link again
    await expect(
      page.getByRole("link", { name: "로그인" }).first(),
    ).toBeVisible()
  })
})
