import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useDeclineQuote } from "../hooks/useDeclineQuote"
import { useRequestQuotes } from "../hooks/useRequestQuotes"
import { useSelectQuote } from "../hooks/useSelectQuote"

vi.mock("../api/quotes-api", () => ({
  getRequestQuotes: vi.fn(),
  selectQuote: vi.fn(),
  declineQuote: vi.fn(),
}))

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe("quotes hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("loads request quotes", async () => {
    const { getRequestQuotes } = await import("../api/quotes-api")
    vi.mocked(getRequestQuotes).mockResolvedValueOnce({
      items: [{ quoteId: "quo_1", supplierId: "sprof_1", companyName: "예시 식품", unitPriceEstimate: 800, moq: 2000, leadTime: 30, state: "submitted", threadId: "thd_1", submittedAt: "2026-03-20T00:00:00Z" }],
      meta: { page: 1, size: 20 },
    })

    const { result } = renderHook(() => useRequestQuotes("req_1", { page: 1, size: 20 }), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items[0].quoteId).toBe("quo_1")
  })

  it("selects quote", async () => {
    const { selectQuote } = await import("../api/quotes-api")
    vi.mocked(selectQuote).mockResolvedValueOnce({ quoteId: "quo_1", state: "selected", requestState: "closed", selectedAt: "2026-03-20T00:00:00Z" })
    const { result } = renderHook(() => useSelectQuote("req_1"), { wrapper: createWrapper() })
    result.current.mutate("quo_1")
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it("declines quote", async () => {
    const { declineQuote } = await import("../api/quotes-api")
    vi.mocked(declineQuote).mockResolvedValueOnce({ quoteId: "quo_1", state: "declined", declinedAt: "2026-03-20T00:00:00Z" })
    const { result } = renderHook(() => useDeclineQuote("req_1"), { wrapper: createWrapper() })
    result.current.mutate({ quoteId: "quo_1", reason: "예산 초과" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
