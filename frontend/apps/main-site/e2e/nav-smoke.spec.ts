import { expect, test } from "@playwright/test"

test.describe("Top navigation", () => {
  test("home → suppliers → notices → home via header links", async ({
    page,
  }) => {
    await page.goto("/")

    // 헤더 link "공급자 탐색" 클릭
    await page.getByRole("link", { name: "공급자 탐색" }).first().click()
    await expect(page).toHaveURL(/\/suppliers$/)
    await expect(page.getByRole("heading", { name: "검색 결과" })).toBeVisible()

    // 헤더 "공지사항"
    await page.getByRole("link", { name: "공지사항" }).first().click()
    await expect(page).toHaveURL(/\/notices$/)
    await expect(page.getByRole("heading", { name: "공지사항" })).toBeVisible()

    // 헤더 "홈"
    await page.getByRole("link", { name: "홈" }).first().click()
    await expect(page).toHaveURL(/\/$/)
  })

  test("brand link in header always returns to home", async ({ page }) => {
    await page.goto("/notices")
    await page.getByRole("link", { name: "잇다" }).first().click()
    await expect(page).toHaveURL(/\/$/)
  })

  test("login/signup links visible when logged out", async ({ page }) => {
    await page.goto("/")
    await expect(
      page.getByRole("link", { name: "로그인" }).first(),
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: "회원가입" }).first(),
    ).toBeVisible()
  })
})
