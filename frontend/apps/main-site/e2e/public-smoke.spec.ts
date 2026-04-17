import { expect, test } from "@playwright/test"

test.describe("Public smoke flows", () => {
  test("notice list loads and selects detail", async ({ page }) => {
    await page.goto("/notices")

    await expect(page.getByRole("heading", { name: "공지사항" })).toBeVisible()

    const firstNoticeButton = page
      .locator(".two-col-master-detail button")
      .first()
    await expect(firstNoticeButton).toBeVisible()

    const titleText = (
      await firstNoticeButton.locator("span").first().textContent()
    )?.trim()

    await firstNoticeButton.click()

    if (titleText) {
      await expect(
        page.getByRole("heading", { level: 2, name: titleText }),
      ).toBeVisible()
    }
  })

  test("supplier search loads and opens detail", async ({ page }) => {
    await page.goto("/suppliers")

    await expect(page.getByRole("heading", { name: "검색 결과" })).toBeVisible()

    const firstCard = page.locator(".supplier-card").first()
    await expect(firstCard).toBeVisible()

    const companyName = (
      await firstCard.locator("h2").first().textContent()
    )?.trim()
    await firstCard.click()

    await expect(page).toHaveURL(/\/suppliers\/[^/]+$/)

    if (companyName) {
      await expect(
        page.getByRole("heading", { name: companyName }),
      ).toBeVisible()
    }
  })
})
