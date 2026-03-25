import { describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StatsDashboardPage } from "../pages/StatsDashboardPage"
import { useStatsSummary } from "../hooks/useStatsSummary"

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

vi.mock("../hooks/useStatsSummary", () => ({
  useStatsSummary: vi.fn(),
}))

describe("StatsDashboardPage", () => {
  it("renders loading state", () => {
    vi.mocked(useStatsSummary).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as never)

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <StatsDashboardPage />
      </QueryClientProvider>,
    )

    expect(screen.getByText("로딩 중...")).toBeInTheDocument()
  })

  it("renders stats dashboard with data", () => {
    vi.mocked(useStatsSummary).mockReturnValue({
      data: {
        users: {
          total: 150,
          requesters: 80,
          suppliers: 65,
          admins: 5,
        },
        suppliersByState: {
          approved: 40,
          submitted: 10,
          underReview: 5,
          hold: 3,
          rejected: 2,
          suspended: 5,
          draft: 0,
        },
        reviews: {
          pending: 12,
          avgReviewDays: 3.5,
          totalReviewed: 150,
        },
        requests: {
          total: 200,
          open: 50,
          closed: 120,
          cancelled: 20,
          draft: 10,
        },
        period: {
          from: "2026-02-01",
          to: "2026-03-01",
        },
      },
      isLoading: false,
      error: null,
    } as never)

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <StatsDashboardPage />
      </QueryClientProvider>,
    )

    expect(screen.getByText("통계 대시보드")).toBeInTheDocument()
    const userSection = screen.getByRole("heading", { name: "사용자 통계" }).parentElement
    expect(userSection).not.toBeNull()
    const scope = within(userSection as HTMLElement)
    expect(scope.getByText("전체 사용자")).toBeInTheDocument()
    expect(scope.getByText("의뢰자")).toBeInTheDocument()
    expect(scope.getByText("공급자")).toBeInTheDocument()
    expect(scope.getByText("관리자")).toBeInTheDocument()
    expect(scope.getByText("150")).toBeInTheDocument()
    expect(scope.getByText("80")).toBeInTheDocument()
    expect(scope.getByText("65")).toBeInTheDocument()
  })
})
