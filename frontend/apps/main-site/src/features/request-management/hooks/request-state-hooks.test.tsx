import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { usePublishRequest } from "../hooks/usePublishRequest"
import { useCloseRequest } from "../hooks/useCloseRequest"
import { useCancelRequest } from "../hooks/useCancelRequest"

vi.mock("../api/request-api", () => ({
  publishRequest: vi.fn(),
  closeRequest: vi.fn(),
  cancelRequest: vi.fn(),
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

describe("request state mutation hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("usePublishRequest", () => {
    it("publishes draft request and invalidates queries", async () => {
      const { publishRequest } = await import("../api/request-api")
      vi.mocked(publishRequest).mockResolvedValueOnce({
        requestId: "req_01",
        state: "open",
        publishedAt: "2026-03-20T10:00:00Z",
      })

      const { result } = renderHook(() => usePublishRequest(), {
        wrapper: createWrapper(),
      })

      result.current.mutate("req_01")

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.state).toBe("open")
      expect(publishRequest).toHaveBeenCalledWith("req_01", expect.any(Object))
    })

    it("handles publish error", async () => {
      const { publishRequest } = await import("../api/request-api")
      vi.mocked(publishRequest).mockRejectedValueOnce(new Error("Publish failed"))

      const { result } = renderHook(() => usePublishRequest(), {
        wrapper: createWrapper(),
      })

      result.current.mutate("req_01")

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeDefined()
    })
  })

  describe("useCloseRequest", () => {
    it("closes open request and invalidates queries", async () => {
      const { closeRequest } = await import("../api/request-api")
      vi.mocked(closeRequest).mockResolvedValueOnce({
        requestId: "req_01",
        state: "closed",
        closedAt: "2026-03-20T11:00:00Z",
      })

      const { result } = renderHook(() => useCloseRequest(), {
        wrapper: createWrapper(),
      })

      result.current.mutate("req_01")

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.state).toBe("closed")
      expect(closeRequest).toHaveBeenCalledWith("req_01", expect.any(Object))
    })

    it("handles close error", async () => {
      const { closeRequest } = await import("../api/request-api")
      vi.mocked(closeRequest).mockRejectedValueOnce(new Error("Close failed"))

      const { result } = renderHook(() => useCloseRequest(), {
        wrapper: createWrapper(),
      })

      result.current.mutate("req_01")

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeDefined()
    })
  })

  describe("useCancelRequest", () => {
    it("cancels request with reason and invalidates queries", async () => {
      const { cancelRequest } = await import("../api/request-api")
      vi.mocked(cancelRequest).mockResolvedValueOnce({
        requestId: "req_01",
        state: "cancelled",
        cancelledAt: "2026-03-20T12:00:00Z",
      })

      const { result } = renderHook(() => useCancelRequest(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ requestId: "req_01", reason: "Project cancelled" })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.state).toBe("cancelled")
      expect(cancelRequest).toHaveBeenCalledWith("req_01", { reason: "Project cancelled" })
    })

    it("cancels request without reason", async () => {
      const { cancelRequest } = await import("../api/request-api")
      vi.mocked(cancelRequest).mockResolvedValueOnce({
        requestId: "req_01",
        state: "cancelled",
        cancelledAt: "2026-03-20T12:00:00Z",
      })

      const { result } = renderHook(() => useCancelRequest(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ requestId: "req_01" })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(cancelRequest).toHaveBeenCalledWith("req_01", { reason: undefined })
    })

    it("handles cancel error", async () => {
      const { cancelRequest } = await import("../api/request-api")
      vi.mocked(cancelRequest).mockRejectedValueOnce(new Error("Cancel failed"))

      const { result } = renderHook(() => useCancelRequest(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ requestId: "req_01", reason: "Test" })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeDefined()
    })
  })
})
