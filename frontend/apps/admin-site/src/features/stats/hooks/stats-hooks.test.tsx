import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useStatsSummary } from "../hooks/useStatsSummary"

vi.mock("../api/stats-api", () => ({
  getStatsSummary: vi.fn(),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe("admin-site stats hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("useStatsSummary", () => {
    it("fetches stats summary", async () => {
      const { getStatsSummary } = await import("../api/stats-api")
      vi.mocked(getStatsSummary).mockResolvedValueOnce({
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
      })

      const { result } = renderHook(() => useStatsSummary({ fromDate: "2026-02-01", toDate: "2026-03-01" }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.users.total).toBe(150)
      expect(result.current.data?.reviews.pending).toBe(12)
      expect(result.current.data?.requests.open).toBe(50)
    })
  })
})
