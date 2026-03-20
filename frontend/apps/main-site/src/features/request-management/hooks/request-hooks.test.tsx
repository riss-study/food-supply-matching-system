import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useRequestList } from "../hooks/useRequestList"
import { useRequestDetail } from "../hooks/useRequestDetail"
import { useCreateRequest } from "../hooks/useCreateRequest"

vi.mock("../api/request-api", () => ({
  getRequestList: vi.fn(),
  getRequestDetail: vi.fn(),
  createRequest: vi.fn(),
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

describe("request-management hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("useRequestList", () => {
    it("fetches request list", async () => {
      const { getRequestList } = await import("../api/request-api")
      vi.mocked(getRequestList).mockResolvedValueOnce({
        items: [
          {
            requestId: "req_01",
            title: "Test",
            category: "snack",
            state: "open",
            mode: "public",
            quoteCount: 0,
            createdAt: "2026-03-20T00:00:00Z",
          },
        ],
        meta: { page: 1, totalPages: 1, hasNext: false, hasPrev: false },
      })

      const { result } = renderHook(() => useRequestList({ state: "open", page: 1 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.items).toHaveLength(1)
      expect(result.current.data?.items[0].requestId).toBe("req_01")
    })
  })

  describe("useRequestDetail", () => {
    it("fetches request detail", async () => {
      const { getRequestDetail } = await import("../api/request-api")
      vi.mocked(getRequestDetail).mockResolvedValueOnce({
        requestId: "req_01",
        mode: "public",
        title: "Test",
        category: "snack",
        desiredVolume: 1000,
        certificationRequirement: [],
        state: "open",
        requester: { businessName: "Test Co", contactName: "John" },
        createdAt: "2026-03-20T00:00:00Z",
        targetSuppliers: [],
      })

      const { result } = renderHook(() => useRequestDetail("req_01"), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.title).toBe("Test")
    })

    it("does not fetch when requestId is empty", async () => {
      const { getRequestDetail } = await import("../api/request-api")

      const { result } = renderHook(() => useRequestDetail(""), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.fetchStatus).toBe("idle")
      expect(getRequestDetail).not.toHaveBeenCalled()
    })
  })

  describe("useCreateRequest", () => {
    it("creates request and invalidates list", async () => {
      const { createRequest } = await import("../api/request-api")
      vi.mocked(createRequest).mockResolvedValueOnce({
        requestId: "req_new",
        state: "draft",
        createdAt: "2026-03-20T00:00:00Z",
      })

      const { result } = renderHook(() => useCreateRequest(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        mode: "public",
        title: "New Request",
        category: "snack",
        desiredVolume: 1000,
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.requestId).toBe("req_new")
    })
  })
})
