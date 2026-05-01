import { expect, test, type Page } from "@playwright/test"

const BUYER = { email: "buyer@test.com", password: "Test1234!" }
const SUPPLIER3 = { email: "supplier3@test.com", password: "Test1234!" }

async function login(page: Page, creds: { email: string; password: string }) {
  await page.goto("/login")
  await page.getByPlaceholder("name@company.com").fill(creds.email)
  await page.getByPlaceholder("비밀번호를 입력하세요").fill(creds.password)
  await page.getByRole("button", { name: "로그인" }).click()
  await page.waitForURL(/\/$/)
}

test.describe.configure({ mode: "serial" })

test.describe("Login flow (interceptor + cache 동작)", () => {
  test("잘못된 비밀번호 → 화면 reload 없이 에러 메시지 + 입력 유지", async ({ page }) => {
    await page.goto("/login")
    await page.getByPlaceholder("name@company.com").fill(BUYER.email)
    await page.getByPlaceholder("비밀번호를 입력하세요").fill("WrongPassword!1")

    let pageReloaded = false
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame() && !frame.url().endsWith("/login")) {
        pageReloaded = true
      }
    })

    await page.getByRole("button", { name: "로그인" }).click()

    await expect(
      page.getByRole("alert").filter({ hasText: /일치하지 않습니다/ }),
    ).toBeVisible({ timeout: 5_000 })

    // reload 없이 에러 표시 — 즉, /login 페이지에서 이탈하지 않음
    await expect(page).toHaveURL(/\/login$/)
    expect(pageReloaded).toBe(false)

    // 입력 필드의 이메일 값이 사라지지 않았는지 (UI 상태 보존)
    await expect(page.getByPlaceholder("name@company.com")).toHaveValue(BUYER.email)
  })

  test("계정 전환 (supplier3 → 로그아웃 → buyer 즉시 로그인) 정상 진입", async ({ page }) => {
    await login(page, SUPPLIER3)
    await expect(page.getByText(SUPPLIER3.email)).toBeVisible()

    // 로그아웃 — useLogout 이 store + react-query cache 동시 비움
    await page.getByRole("button", { name: "로그아웃" }).first().click()
    await expect(page.getByRole("link", { name: "로그인" }).first()).toBeVisible()

    // 즉시 buyer 로 로그인 (이전 사용자 cache race 시나리오 회귀 방지)
    await login(page, BUYER)
    await expect(page.getByText(BUYER.email)).toBeVisible()
  })

  // rate limit 테스트는 IP 를 60초 lockout 시키므로 마지막에 — 다른 케이스에 영향 안 주게.
  test("rate limit (429) 발생 시 다른 메시지 노출", async ({ page }) => {
    await page.goto("/login")
    for (let i = 0; i < 10; i++) {
      await page.getByPlaceholder("name@company.com").fill(`bad${i}@test.com`)
      await page.getByPlaceholder("비밀번호를 입력하세요").fill("WrongPassword!1")
      await page.getByRole("button", { name: "로그인" }).click()
      await page.waitForTimeout(150)
    }
    await page.getByPlaceholder("name@company.com").fill(BUYER.email)
    await page.getByPlaceholder("비밀번호를 입력하세요").fill("WrongAgain!1")
    await page.getByRole("button", { name: "로그인" }).click()

    await expect(
      page.getByRole("alert").filter({ hasText: /로그인 시도가 너무 많습니다/ }),
    ).toBeVisible({ timeout: 5_000 })
  })
})
