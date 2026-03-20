import { describe, expect, it, vi } from "vitest"
import { getSupplierQuotes, submitQuote, updateQuote, withdrawQuote } from "../api/supplier-quotes-api"

vi.mock("../../auth/lib/api-client", () => ({
  authApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe("supplier-quotes-api", () => {
  it("submits quote", async () => {
    const { authApiClient } = await import("../../auth/lib/api-client")
    vi.mocked(authApiClient.post).mockResolvedValueOnce({
      data: { data: { quoteId: "quo_1", state: "submitted", threadId: "thd_1", createdAt: "2026-03-20T00:00:00Z" } },
    })

    const result = await submitQuote("req_1", { unitPriceEstimate: 800, moq: 2000, leadTime: 30 })
    expect(result.threadId).toBe("thd_1")
  })

  it("returns supplier quote list with meta", async () => {
    const { authApiClient } = await import("../../auth/lib/api-client")
    vi.mocked(authApiClient.get).mockResolvedValueOnce({
      data: {
        data: [{ quoteId: "quo_1", requestId: "req_1", requestTitle: "테스트 의뢰", category: "snack", unitPriceEstimate: 800, moq: 2000, leadTime: 30, state: "submitted", version: 1, threadId: "thd_1", submittedAt: "2026-03-20T00:00:00Z" }],
        meta: { page: 1, size: 20, totalElements: 1, totalPages: 1, hasNext: false, hasPrev: false },
      },
    })

    const result = await getSupplierQuotes({ page: 1, size: 20 })
    expect(result.items).toHaveLength(1)
    expect(result.meta.totalElements).toBe(1)
  })

  it("updates quote", async () => {
    const { authApiClient } = await import("../../auth/lib/api-client")
    vi.mocked(authApiClient.patch).mockResolvedValueOnce({
      data: { data: { quoteId: "quo_1", state: "submitted", version: 2, updatedAt: "2026-03-20T01:00:00Z" } },
    })
    const result = await updateQuote("quo_1", { unitPriceEstimate: 750 })
    expect(result.version).toBe(2)
  })

  it("withdraws quote", async () => {
    const { authApiClient } = await import("../../auth/lib/api-client")
    vi.mocked(authApiClient.post).mockResolvedValueOnce({
      data: { data: { quoteId: "quo_1", state: "withdrawn", withdrawnAt: "2026-03-20T01:00:00Z" } },
    })
    const result = await withdrawQuote("quo_1")
    expect(result.state).toBe("withdrawn")
  })
})
