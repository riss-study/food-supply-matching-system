import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SupplierQuoteListPage } from "./SupplierQuoteListPage"

const mockUseSupplierQuotes = vi.fn()
const mockUseUpdateQuote = vi.fn()
const mockUseWithdrawQuote = vi.fn()

vi.mock("../hooks/useSupplierQuotes", () => ({
  useSupplierQuotes: (...args: unknown[]) => mockUseSupplierQuotes(...args),
}))

vi.mock("../hooks/useUpdateQuote", () => ({
  useUpdateQuote: () => mockUseUpdateQuote(),
}))

vi.mock("../hooks/useWithdrawQuote", () => ({
  useWithdrawQuote: () => mockUseWithdrawQuote(),
}))

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SupplierQuoteListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("SupplierQuoteListPage", () => {
  beforeEach(() => {
    mockUseSupplierQuotes.mockReturnValue({
      data: {
        items: [
          {
            quoteId: "quo_1",
            requestId: "req_1",
            requestTitle: "테스트 의뢰",
            category: "snack",
            unitPriceEstimate: "800원/개",
            moq: "2,000개",
            leadTime: "30일",
            sampleCost: "50,000원",
            state: "submitted",
            version: 1,
            threadId: "thd_1",
            submittedAt: "2026-03-20T00:00:00Z",
          },
        ],
        meta: { page: 1, size: 20, totalPages: 1, hasPrev: false, hasNext: false },
      },
      isLoading: false,
      error: null,
    })

    mockUseUpdateQuote.mockReturnValue({
      mutate: vi.fn((_: unknown, options?: { onSuccess?: () => void }) => options?.onSuccess?.()),
      isPending: false,
    })

    mockUseWithdrawQuote.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("opens edit controls and saves updated quote values", () => {
    renderPage()

    fireEvent.click(screen.getByRole("button", { name: "수정" }))
    fireEvent.change(screen.getByPlaceholderText(/예상 단가|950원/), { target: { value: "750원/개" } })
    fireEvent.click(screen.getByRole("button", { name: "저장" }))

    expect(mockUseUpdateQuote.mock.results[0]?.value.mutate).toHaveBeenCalledWith(
      {
        quoteId: "quo_1",
        request: {
          unitPriceEstimate: "750원/개",
          moq: expect.any(String),
          leadTime: expect.any(String),
          sampleCost: expect.anything(),
          note: undefined,
        },
      },
      expect.any(Object),
    )
  })

  it("withdraws a submitted quote from the list", () => {
    renderPage()

    fireEvent.click(screen.getByRole("button", { name: "철회" }))

    expect(mockUseWithdrawQuote.mock.results[0]?.value.mutate).toHaveBeenCalledWith("quo_1")
  })

  it("blocks invalid edit values before saving", () => {
    renderPage()

    fireEvent.click(screen.getByRole("button", { name: "수정" }))
    fireEvent.change(screen.getByPlaceholderText(/예상 단가|950원/), { target: { value: "" } })
    fireEvent.click(screen.getByRole("button", { name: "저장" }))

    expect(screen.getByText("단가, MOQ, 납기는 필수 입력입니다.")).toBeInTheDocument()
    expect(mockUseUpdateQuote.mock.results[0]?.value.mutate).not.toHaveBeenCalled()
  })
})
