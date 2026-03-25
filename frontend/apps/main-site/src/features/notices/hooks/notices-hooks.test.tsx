import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { usePublicNotices } from "../hooks/usePublicNotices"
import { usePublicNoticeDetail } from "../hooks/usePublicNoticeDetail"

vi.mock("../api/notices-api", () => ({
  getPublicNotices: vi.fn(),
  getPublicNoticeDetail: vi.fn(),
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

describe("main-site public notice hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("usePublicNotices", () => {
    it("fetches public notice list", async () => {
      const { getPublicNotices } = await import("../api/notices-api")
      vi.mocked(getPublicNotices).mockResolvedValueOnce({
        items: [
          {
            noticeId: "notice_01",
            title: "Public Notice",
            excerpt: "Public excerpt",
            publishedAt: "2026-03-20T00:00:00Z",
          },
        ],
        meta: { page: 1, totalPages: 1, hasNext: false, hasPrev: false },
      })

      const { result } = renderHook(() => usePublicNotices({ page: 1 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.items).toHaveLength(1)
      expect(result.current.data?.items[0].noticeId).toBe("notice_01")
    })
  })

  describe("usePublicNoticeDetail", () => {
    it("fetches public notice detail", async () => {
      const { getPublicNoticeDetail } = await import("../api/notices-api")
      vi.mocked(getPublicNoticeDetail).mockResolvedValueOnce({
        noticeId: "notice_01",
        title: "Public Notice Detail",
        body: "Full body content",
        publishedAt: "2026-03-20T00:00:00Z",
        viewCount: 200,
        attachments: [],
      })

      const { result } = renderHook(() => usePublicNoticeDetail("notice_01"), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.title).toBe("Public Notice Detail")
      expect(result.current.data?.viewCount).toBe(200)
    })

    it("does not fetch when noticeId is empty", async () => {
      const { getPublicNoticeDetail } = await import("../api/notices-api")

      const { result } = renderHook(() => usePublicNoticeDetail(""), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.fetchStatus).toBe("idle")
      expect(getPublicNoticeDetail).not.toHaveBeenCalled()
    })
  })
})
