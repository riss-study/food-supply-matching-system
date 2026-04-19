import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useSubmitQuote } from "../hooks/useSubmitQuote"
import { useSupplierQuotes } from "../hooks/useSupplierQuotes"
import { useUpdateQuote } from "../hooks/useUpdateQuote"
import { useWithdrawQuote } from "../hooks/useWithdrawQuote"

vi.mock("../api/supplier-quotes-api", () => ({
  submitQuote: vi.fn(),
  getSupplierQuotes: vi.fn(),
  updateQuote: vi.fn(),
  withdrawQuote: vi.fn(),
}))

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe("supplier quotes hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("loads supplier quote list", async () => {
    const { getSupplierQuotes } = await import("../api/supplier-quotes-api")
    vi.mocked(getSupplierQuotes).mockResolvedValueOnce({
      items: [{ quoteId: "quo_1", requestId: "req_1", requestTitle: "테스트", category: "snack", unitPriceEstimate: "800", moq: "2000", leadTime: "30", state: "submitted", version: 1, threadId: "thd_1", submittedAt: "2026-03-20T00:00:00Z" }],
      meta: { page: 1, size: 20 },
    })
    const { result } = renderHook(() => useSupplierQuotes({ page: 1, size: 20 }), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items[0].quoteId).toBe("quo_1")
  })

  it("submits quote", async () => {
    const { submitQuote } = await import("../api/supplier-quotes-api")
    vi.mocked(submitQuote).mockResolvedValueOnce({ quoteId: "quo_1", state: "submitted", threadId: "thd_1", createdAt: "2026-03-20T00:00:00Z" })
    const { result } = renderHook(() => useSubmitQuote(), { wrapper: createWrapper() })
    result.current.mutate({ requestId: "req_1", request: { unitPriceEstimate: "800", moq: "2000", leadTime: "30" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it("updates quote", async () => {
    const { updateQuote } = await import("../api/supplier-quotes-api")
    vi.mocked(updateQuote).mockResolvedValueOnce({ quoteId: "quo_1", state: "submitted", version: 2, updatedAt: "2026-03-20T00:00:00Z" })
    const { result } = renderHook(() => useUpdateQuote(), { wrapper: createWrapper() })
    result.current.mutate({ quoteId: "quo_1", request: { unitPriceEstimate: "750" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it("withdraws quote", async () => {
    const { withdrawQuote } = await import("../api/supplier-quotes-api")
    vi.mocked(withdrawQuote).mockResolvedValueOnce({ quoteId: "quo_1", state: "withdrawn", withdrawnAt: "2026-03-20T00:00:00Z" })
    const { result } = renderHook(() => useWithdrawQuote(), { wrapper: createWrapper() })
    result.current.mutate({ quoteId: "quo_1", requestId: "req_1" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
