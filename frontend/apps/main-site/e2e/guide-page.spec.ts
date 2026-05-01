import { expect, test, type Page } from "@playwright/test"

const BUYER = { email: "buyer@test.com", password: "Test1234!" }

async function login(page: Page, creds: { email: string; password: string }) {
  await page.goto("/login")
  await page.getByPlaceholder("name@company.com").fill(creds.email)
  await page.getByPlaceholder("비밀번호를 입력하세요").fill(creds.password)
  await page.getByRole("button", { name: "로그인" }).click()
  await page.waitForURL(/\/$/)
}

test.describe("이용 가이드 페이지", () => {
  test("비로그인 상태에서도 헤더 메뉴로 진입 가능 + 핵심 콘텐츠 렌더", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: "이용 가이드" }).first().click()
    await expect(page).toHaveURL(/\/guide$/)

    // 헤더 / 용어 / 탭 / 첫 단계 검증
    await expect(page.getByRole("heading", { name: "이용 가이드" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "핵심 용어" })).toBeVisible()
    await expect(page.getByText("의뢰 (Request)")).toBeVisible()

    // 기본 탭은 Buyer — buyer step 2 의 고유 텍스트 (사업자 인증) 검증
    await expect(page.getByText("사업자 인증", { exact: false }).first()).toBeVisible()
    await expect(page.getByText("요청자 역할로 계정을 만드세요.")).toBeVisible()
  })

  test("Supplier 탭으로 전환하면 supplier 흐름이 노출", async ({ page }) => {
    await page.goto("/guide")
    await page.getByRole("tab", { name: /공급자/ }).click()

    // supplier 단계 카드 검증
    await expect(page.getByText("검수 서류 제출", { exact: false })).toBeVisible()
    await expect(page.getByText("의뢰 피드 탐색", { exact: false })).toBeVisible()
  })

  test("PublicLandingHome 의 \"전체 사용 흐름 보기\" CTA 가 /guide 로 이동", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: /전체 사용 흐름 보기/ }).click()
    await expect(page).toHaveURL(/\/guide$/)
  })

  test("로그인 후 시작 화면에 GuideTeaserBanner 노출 + 닫으면 영구 dismiss", async ({ page }) => {
    // localStorage 깨끗한 fresh context
    await page.context().clearCookies()
    await page.goto("/")
    await page.evaluate(() => window.localStorage.clear())

    await login(page, BUYER)

    // 배너 노출 — 링크 보임
    const bannerLink = page.getByRole("link", { name: /이용 가이드 보기/ })
    await expect(bannerLink).toBeVisible()

    // 닫기 → 같은 세션에서 즉시 사라짐
    await page.getByRole("button", { name: "이용 가이드 안내 닫기" }).click()
    await expect(bannerLink).not.toBeVisible()

    // 페이지 새로고침해도 dismiss 유지 (localStorage)
    await page.reload()
    await expect(page.getByRole("link", { name: /이용 가이드 보기/ })).toHaveCount(0)
  })
})
