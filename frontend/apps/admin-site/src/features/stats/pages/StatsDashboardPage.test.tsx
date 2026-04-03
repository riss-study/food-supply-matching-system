import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
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
          under_review: 5,
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

    // KPI cards
    expect(screen.getByText("전체 사용자")).toBeInTheDocument()
    expect(screen.getByText("의뢰자")).toBeInTheDocument()
    expect(screen.getByText("공급자")).toBeInTheDocument()
    expect(screen.getByText("검수대기")).toBeInTheDocument()
    expect(screen.getAllByText("150")).toHaveLength(2) // users.total and reviews.totalReviewed
    expect(screen.getByText("80")).toBeInTheDocument()
    expect(screen.getByText("65")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()

    // Bar chart section
    expect(screen.getByText("공급자 검증 상태 분포")).toBeInTheDocument()
    expect(screen.getByText("승인됨")).toBeInTheDocument()

    // Request stats
    expect(screen.getByText("의뢰 현황")).toBeInTheDocument()
    expect(screen.getByText("전체 의뢰")).toBeInTheDocument()
    expect(screen.getByText("200")).toBeInTheDocument()
  })
})
