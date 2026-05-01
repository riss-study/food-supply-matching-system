import { expect, test } from "@playwright/test"

const SEED_REQUESTER = { email: "buyer@test.com", password: "Test1234!" }
const SEED_SUPPLIER = { email: "supplier@test.com", password: "Test1234!" }

test.describe("Auth flows", () => {
  test("requester can log in and reach home (/)", async ({ page }) => {
    await page.goto("/login")

    await page.getByPlaceholder("name@company.com").fill(SEED_REQUESTER.email)
    await page
      .getByPlaceholder("비밀번호를 입력하세요")
      .fill(SEED_REQUESTER.password)
    await page.getByRole("button", { name: "로그인" }).click()

    await expect(page).toHaveURL(/\/$/)
    // 로그인 후 / 화면 = 배너/스테퍼 (조건부) + 마케팅 랜딩.
    // requester 전용 바로가기 카드 "내 의뢰" heading 으로 사용자 컨텍스트 검증.
    await expect(page.getByRole("heading", { name: "내 의뢰" })).toBeVisible()
  })

  test("supplier can log in and reach home (/) with supplier shortcuts", async ({
    page,
  }) => {
    await page.goto("/login")

    await page.getByPlaceholder("name@company.com").fill(SEED_SUPPLIER.email)
    await page
      .getByPlaceholder("비밀번호를 입력하세요")
      .fill(SEED_SUPPLIER.password)
    await page.getByRole("button", { name: "로그인" }).click()

    await expect(page).toHaveURL(/\/$/)
    // supplier 전용 바로가기 카드 "의뢰 피드" heading
    // (헤더 nav link 가 아니라 카드 안 heading 만 매칭)
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

  test("logout from header dropdown returns to public state", async ({ page }) => {
    await page.goto("/login")
    await page.getByPlaceholder("name@company.com").fill(SEED_REQUESTER.email)
    await page
      .getByPlaceholder("비밀번호를 입력하세요")
      .fill(SEED_REQUESTER.password)
    await page.getByRole("button", { name: "로그인" }).click()
    await expect(page).toHaveURL(/\/$/)

    // 헤더 사용자 chip 클릭 → 드롭다운 → 로그아웃
    await page.locator(".main-header-user").click()
    await page.getByRole("button", { name: "로그아웃" }).click()

    // 로그아웃 후 헤더에 다시 "로그인" link 노출
    await expect(
      page.getByRole("link", { name: "로그인" }).first(),
    ).toBeVisible()
  })
})
