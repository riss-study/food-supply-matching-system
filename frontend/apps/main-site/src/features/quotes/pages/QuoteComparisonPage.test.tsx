import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { QuoteComparisonPage } from "./QuoteComparisonPage"

const mockUseRequestQuotes = vi.fn()
const mockUseSelectQuote = vi.fn()
const mockUseDeclineQuote = vi.fn()

vi.mock("../hooks/useRequestQuotes", () => ({
  useRequestQuotes: (...args: unknown[]) => mockUseRequestQuotes(...args),
}))

vi.mock("../hooks/useSelectQuote", () => ({
  useSelectQuote: (...args: unknown[]) => mockUseSelectQuote(...args),
}))

vi.mock("../hooks/useDeclineQuote", () => ({
  useDeclineQuote: (...args: unknown[]) => mockUseDeclineQuote(...args),
}))

function renderPage(initialEntries = ["/requests/req_1/quotes"]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/requests/:requestId/quotes" element={<QuoteComparisonPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("QuoteComparisonPage", () => {
  const quote = {
    quoteId: "quo_1",
    supplierId: "sup_1",
    companyName: "예시 식품",
    unitPriceEstimate: 800,
    moq: 2000,
    leadTime: 30,
    sampleCost: 50000,
    note: "기본 견적",
    state: "submitted",
    threadId: "thd_1",
    submittedAt: "2026-03-20T00:00:00Z",
  }

  beforeEach(() => {
    mockUseRequestQuotes.mockReturnValue({
      data: {
        items: [quote],
        meta: { page: 1, size: 20, totalPages: 1, hasPrev: false, hasNext: false },
      },
      isLoading: false,
      error: null,
    })

    mockUseSelectQuote.mockReturnValue({
      mutate: vi.fn((_: string, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.()
      }),
      isPending: false,
    })

    mockUseDeclineQuote.mockReturnValue({
      mutate: vi.fn((_: { quoteId: string; reason?: string }, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.()
      }),
      isPending: false,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("opens and closes the quote detail dialog", () => {
    renderPage()

    fireEvent.click(screen.getByRole("button", { name: "상세" }))

    const dialog = screen.getByRole("dialog", { name: "견적 상세" })
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByText("예시 식품")).toBeInTheDocument()

    fireEvent.click(within(dialog).getAllByRole("button", { name: "닫기" })[1])

    expect(screen.queryByRole("dialog", { name: "견적 상세" })).not.toBeInTheDocument()
  })

  it("opens the selection confirmation dialog and selects the quote", () => {
    renderPage()

    fireEvent.click(screen.getByRole("button", { name: "선택" }))

    expect(screen.getByRole("dialog", { name: "견적 선택 확인" })).toBeInTheDocument()
    expect(screen.getByText(/의뢰가 마감되고 다른 견적은 자동으로 거절 처리됩니다/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "선택 확정" }))

    expect(mockUseSelectQuote.mock.results[0]?.value.mutate).toHaveBeenCalledWith("quo_1", expect.any(Object))
    expect(screen.queryByRole("dialog", { name: "견적 선택 확인" })).not.toBeInTheDocument()
  })

  it("opens the decline dialog and submits the decline reason", () => {
    renderPage()

    fireEvent.click(screen.getByRole("button", { name: "거절" }))
    fireEvent.change(screen.getByPlaceholderText("거절 사유를 입력하세요 (선택)"), { target: { value: "예산 초과" } })
    fireEvent.click(screen.getByRole("button", { name: "거절 확정" }))

    expect(mockUseDeclineQuote.mock.results[0]?.value.mutate).toHaveBeenCalledWith(
      { quoteId: "quo_1", reason: "예산 초과" },
      expect.any(Object),
    )
  })
})
