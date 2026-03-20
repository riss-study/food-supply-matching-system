import { describe, expect, it, vi } from "vitest"
import { declineQuote, getRequestQuotes, selectQuote } from "../api/quotes-api"

vi.mock("../../auth/lib/api-client", () => ({
  authApiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe("quotes-api", () => {
  it("returns request quotes with meta", async () => {
    const { authApiClient } = await import("../../auth/lib/api-client")
    vi.mocked(authApiClient.get).mockResolvedValueOnce({
      data: {
        data: [{ quoteId: "quo_1", supplierId: "sprof_1", companyName: "예시 식품", unitPriceEstimate: 800, moq: 2000, leadTime: 30, state: "submitted", threadId: "thd_1", submittedAt: "2026-03-20T00:00:00Z" }],
        meta: { page: 1, size: 20, totalElements: 1, totalPages: 1, hasNext: false, hasPrev: false },
      },
    })

    const result = await getRequestQuotes("req_1", { page: 1, size: 20 })

    expect(result.items[0].quoteId).toBe("quo_1")
    expect(result.meta.page).toBe(1)
  })

  it("selects quote", async () => {
    const { authApiClient } = await import("../../auth/lib/api-client")
    vi.mocked(authApiClient.post).mockResolvedValueOnce({
      data: { data: { quoteId: "quo_1", state: "selected", requestState: "closed", selectedAt: "2026-03-20T00:00:00Z" } },
    })

    const result = await selectQuote("quo_1")
    expect(result.state).toBe("selected")
  })

  it("declines quote with reason", async () => {
    const { authApiClient } = await import("../../auth/lib/api-client")
    vi.mocked(authApiClient.post).mockResolvedValueOnce({
      data: { data: { quoteId: "quo_1", state: "declined", declinedAt: "2026-03-20T00:00:00Z" } },
    })

    const result = await declineQuote("quo_1", { reason: "예산 초과" })
    expect(result.state).toBe("declined")
  })
})
