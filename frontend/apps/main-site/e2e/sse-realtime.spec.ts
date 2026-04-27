import { expect, test, type BrowserContext, type Page } from "@playwright/test"

const BUYER = { email: "buyer@test.com", password: "Test1234!" }
const SUPPLIER = { email: "supplier3@test.com", password: "Test1234!" }   // sprof_seed_03 — buyer 와 thread 공유

async function login(page: Page, creds: { email: string; password: string }) {
  await page.goto("/login")
  await page.getByPlaceholder("name@company.com").fill(creds.email)
  await page.getByPlaceholder("비밀번호를 입력하세요").fill(creds.password)
  await page.getByRole("button", { name: "로그인" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

async function openFirstThread(page: Page): Promise<string> {
  await page.goto("/threads")
  // thread 목록의 첫 번째 항목 클릭 (a 태그 또는 클릭 가능한 카드)
  const firstThreadLink = page.locator("a[href*='/threads/']").first()
  await firstThreadLink.waitFor({ state: "visible", timeout: 10_000 })
  const href = (await firstThreadLink.getAttribute("href")) ?? ""
  await firstThreadLink.click()
  await expect(page).toHaveURL(new RegExp(`/threads/[^/]+$`))
  return href
}

async function sendMessage(page: Page, text: string) {
  const input = page.getByPlaceholder("메시지를 입력하세요...")
  await input.fill(text)
  await page.getByRole("button", { name: /전송/ }).click()
  // 전송 직후 input 비워짐 (자기 화면에 표시 됨은 별개 검증)
  await expect(input).toHaveValue("", { timeout: 5_000 })
}

test.describe("SSE 실시간 채팅", () => {
  test("supplier 가 보낸 메시지가 buyer 화면에 새로고침 없이 도착", async ({ browser }) => {
    const buyerCtx: BrowserContext = await browser.newContext()
    const supplierCtx: BrowserContext = await browser.newContext()
    const buyerPage = await buyerCtx.newPage()
    const supplierPage = await supplierCtx.newPage()

    try {
      // 두 사용자 로그인
      await login(buyerPage, BUYER)
      await login(supplierPage, SUPPLIER)

      // 두 사용자 모두 thread 진입 — 같은 thread 가정
      const buyerThreadHref = await openFirstThread(buyerPage)
      const supplierThreadHref = await openFirstThread(supplierPage)

      // 같은 thread 가 아니면 skip (시드 데이터에 thread 가 두 사용자에 공통이 없으면)
      test.skip(
        buyerThreadHref !== supplierThreadHref,
        `두 사용자의 첫 thread 가 다름 (buyer: ${buyerThreadHref}, supplier: ${supplierThreadHref}). 시드 데이터 점검 필요.`,
      )

      // supplier 가 unique 한 메시지 전송
      const uniqueText = `SSE-test-${Date.now()}`
      await sendMessage(supplierPage, uniqueText)

      // buyer 화면에 새로고침 없이 그 메시지가 5초 이내 도착해야 함
      await expect(buyerPage.getByText(uniqueText, { exact: false })).toBeVisible({ timeout: 5_000 })
    } finally {
      await buyerCtx.close()
      await supplierCtx.close()
    }
  })

  test("buyer 가 보낸 메시지가 supplier 화면에 새로고침 없이 도착", async ({ browser }) => {
    const buyerCtx: BrowserContext = await browser.newContext()
    const supplierCtx: BrowserContext = await browser.newContext()
    const buyerPage = await buyerCtx.newPage()
    const supplierPage = await supplierCtx.newPage()

    try {
      await login(buyerPage, BUYER)
      await login(supplierPage, SUPPLIER)

      const buyerThreadHref = await openFirstThread(buyerPage)
      const supplierThreadHref = await openFirstThread(supplierPage)

      test.skip(
        buyerThreadHref !== supplierThreadHref,
        `두 사용자의 첫 thread 가 다름. 시드 데이터 점검 필요.`,
      )

      const uniqueText = `SSE-buyer-${Date.now()}`
      await sendMessage(buyerPage, uniqueText)

      await expect(supplierPage.getByText(uniqueText, { exact: false })).toBeVisible({ timeout: 5_000 })
    } finally {
      await buyerCtx.close()
      await supplierCtx.close()
    }
  })
})
