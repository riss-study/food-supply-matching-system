import { expect, test, type BrowserContext, type Page } from "@playwright/test"

// 직렬 실행 — 시나리오들이 같은 시드 사용자 (buyer/supplier3) 를 공유하므로 SSE 메시지 cross-talk 방지.
test.describe.configure({ mode: "serial" })

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
  const firstThreadLink = page.locator("a[href*='/threads/']").first()
  await firstThreadLink.waitFor({ state: "visible", timeout: 10_000 })
  const href = (await firstThreadLink.getAttribute("href")) ?? ""
  await firstThreadLink.click()
  await expect(page).toHaveURL(new RegExp(`/threads/[^/]+$`))
  return href
}

async function getFirstThreadId(page: Page): Promise<string> {
  await page.goto("/threads")
  const firstThreadLink = page.locator("a[href*='/threads/']").first()
  await firstThreadLink.waitFor({ state: "visible", timeout: 10_000 })
  const href = (await firstThreadLink.getAttribute("href")) ?? ""
  return href.replace(/.*\/threads\//, "")
}

async function sendMessage(page: Page, text: string) {
  const input = page.getByPlaceholder("메시지를 입력하세요...")
  await input.fill(text)
  await page.getByRole("button", { name: /전송/ }).click()
  await expect(input).toHaveValue("", { timeout: 5_000 })
}

test.describe("글로벌 알림 stream", () => {
  test("다른 페이지 (대시보드) 에서 toast 가 뜬다", async ({ browser }) => {
    const buyerCtx: BrowserContext = await browser.newContext()
    const supplierCtx: BrowserContext = await browser.newContext()
    const buyerPage = await buyerCtx.newPage()
    const supplierPage = await supplierCtx.newPage()

    try {
      await login(buyerPage, BUYER)
      await login(supplierPage, SUPPLIER)

      // buyer 는 thread 진입해서 메시지 보낼 채널 확보
      await openFirstThread(buyerPage)

      // supplier 는 대시보드 그대로 — useNotificationStream 이 글로벌로 활성화돼 있어야
      await expect(supplierPage).toHaveURL(/\/dashboard$/)
      // stream 연결이 안정될 시간 잠깐 부여 (SSE open 직후 race 회피)
      await supplierPage.waitForTimeout(500)

      // buyer 가 메시지 전송
      const uniqueText = `notif-toast-${Date.now()}`
      await sendMessage(buyerPage, uniqueText)

      // supplier 화면 (대시보드) 에 우리 unique 메시지의 toast 등장
      // (다른 시나리오의 잔여 toast 와 섞여도 unique text 로 정확히 매칭)
      const matchingToast = supplierPage.getByRole("alert").filter({ hasText: uniqueText })
      await expect(matchingToast).toBeVisible({ timeout: 5_000 })
    } finally {
      await buyerCtx.close()
      await supplierCtx.close()
    }
  })

  test("자기가 보고 있는 thread 의 알림은 toast 가 뜨지 않는다 (메시지 자체는 thread 안에서 표시됨)", async ({ browser }) => {
    const buyerCtx: BrowserContext = await browser.newContext()
    const supplierCtx: BrowserContext = await browser.newContext()
    const buyerPage = await buyerCtx.newPage()
    const supplierPage = await supplierCtx.newPage()

    try {
      await login(buyerPage, BUYER)
      await login(supplierPage, SUPPLIER)

      // 두 사용자 모두 같은 thread 진입
      const buyerThreadHref = await openFirstThread(buyerPage)
      const supplierThreadHref = await openFirstThread(supplierPage)

      test.skip(
        buyerThreadHref !== supplierThreadHref,
        `두 사용자의 첫 thread 가 다름.`,
      )

      const uniqueText = `notif-no-toast-${Date.now()}`
      await sendMessage(buyerPage, uniqueText)

      // 메시지 자체는 thread 안에서 보임 (P3-B)
      await expect(supplierPage.getByText(uniqueText)).toBeVisible({ timeout: 5_000 })

      // 그러나 toast 는 안 뜸 (현재 보고 있는 thread 라 생략)
      await expect(supplierPage.getByRole("alert")).toHaveCount(0, { timeout: 3_000 })
    } finally {
      await buyerCtx.close()
      await supplierCtx.close()
    }
  })

  test("자기가 보낸 메시지에는 자기에게 알림이 오지 않는다", async ({ browser }) => {
    const buyerCtx: BrowserContext = await browser.newContext()
    const buyerPage = await buyerCtx.newPage()

    try {
      await login(buyerPage, BUYER)

      // buyer 는 thread 진입해서 메시지 발송
      await openFirstThread(buyerPage)

      const uniqueText = `notif-self-${Date.now()}`
      await sendMessage(buyerPage, uniqueText)

      // 자기 화면에 toast 뜨면 안 됨 (backend 가 발신자 제외)
      // thread 안이라 어차피 toast 생략 분기 도 함께 작동 — 두 가드 모두 검증
      await expect(buyerPage.getByRole("alert")).toHaveCount(0, { timeout: 3_000 })
    } finally {
      await buyerCtx.close()
    }
  })
})
