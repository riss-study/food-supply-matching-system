import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { QuoteCreatePage } from "./QuoteCreatePage"

const mockUseSubmitQuote = vi.fn()

vi.mock("../hooks/useSubmitQuote", () => ({
  useSubmitQuote: () => mockUseSubmitQuote(),
}))

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/quotes/create?requestId=req_1"]}>
        <QuoteCreatePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("QuoteCreatePage", () => {
  beforeEach(() => {
    mockUseSubmitQuote.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("shows a confirmation step before submitting the quote", () => {
    renderPage()

    fireEvent.change(screen.getByPlaceholderText(/원\/kg/), { target: { value: "800원/개" } })
    fireEvent.change(screen.getByPlaceholderText(/1,000개/), { target: { value: "2,000개" } })
    fireEvent.change(screen.getByPlaceholderText(/30일/), { target: { value: "30일" } })
    fireEvent.click(screen.getByRole("button", { name: "견적 제출" }))

    expect(screen.getByText("제출 내용 확인")).toBeInTheDocument()
    expect(screen.getByText("800원/개")).toBeInTheDocument()
    expect(screen.getByText("2,000개")).toBeInTheDocument()
    expect(screen.getByText(/submitted 상태에서는 수정하거나 철회할 수 있습니다/)).toBeInTheDocument()
  })

  it("keeps the submit action disabled when required values are empty", () => {
    renderPage()

    fireEvent.change(screen.getByPlaceholderText(/원\/kg/), { target: { value: "" } })
    fireEvent.change(screen.getByPlaceholderText(/1,000개/), { target: { value: "2,000개" } })
    fireEvent.change(screen.getByPlaceholderText(/30일/), { target: { value: "30일" } })

    expect(screen.getByRole("button", { name: "견적 제출" })).toBeDisabled()
  })

  it("submits the quote with string payload after confirmation", () => {
    renderPage()

    fireEvent.change(screen.getByPlaceholderText(/원\/kg/), { target: { value: "800원/개" } })
    fireEvent.change(screen.getByPlaceholderText(/1,000개/), { target: { value: "2,000개" } })
    fireEvent.change(screen.getByPlaceholderText(/30일/), { target: { value: "30일" } })
    fireEvent.change(screen.getByPlaceholderText(/50,000원/), { target: { value: "50,000원" } })
    fireEvent.change(screen.getByPlaceholderText(/추가 참고사항/), { target: { value: "테스트 견적" } })
    fireEvent.click(screen.getByRole("button", { name: "견적 제출" }))
    fireEvent.click(screen.getByRole("button", { name: "확인하고 제출" }))

    expect(mockUseSubmitQuote.mock.results[0]?.value.mutate).toHaveBeenCalledWith(
      {
        requestId: "req_1",
        request: {
          unitPriceEstimate: "800원/개",
          moq: "2,000개",
          leadTime: "30일",
          sampleCost: "50,000원",
          note: "테스트 견적",
        },
      },
      expect.any(Object),
    )
  })
})
