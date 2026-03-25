import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useNotices } from "../hooks/useNotices"
import { useNoticeDetail } from "../hooks/useNoticeDetail"
import { useCreateNotice } from "../hooks/useCreateNotice"
import { useUpdateNotice } from "../hooks/useUpdateNotice"
import { usePublishNotice } from "../hooks/usePublishNotice"
import { useArchiveNotice } from "../hooks/useArchiveNotice"

vi.mock("../api/notices-api", () => ({
  getNotices: vi.fn(),
  getNoticeDetail: vi.fn(),
  createNotice: vi.fn(),
  updateNotice: vi.fn(),
  publishNotice: vi.fn(),
  archiveNotice: vi.fn(),
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

describe("admin-site notice hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("useNotices", () => {
    it("fetches notice list", async () => {
      const { getNotices } = await import("../api/notices-api")
      vi.mocked(getNotices).mockResolvedValueOnce({
        items: [
          {
            noticeId: "notice_01",
            title: "Test Notice",
            excerpt: "Test excerpt",
            state: "published",
            author: "Admin",
            authorId: "admin_01",
            authorName: "Admin",
            publishedAt: "2026-03-20T00:00:00Z",
            viewCount: 100,
            createdAt: "2026-03-20T00:00:00Z",
            updatedAt: "2026-03-20T00:00:00Z",
          },
        ],
        meta: { page: 1, totalPages: 1, hasNext: false, hasPrev: false },
      })

      const { result } = renderHook(() => useNotices({ page: 1 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.items).toHaveLength(1)
      expect(result.current.data?.items[0].noticeId).toBe("notice_01")
    })
  })

  describe("useNoticeDetail", () => {
    it("fetches notice detail", async () => {
      const { getNoticeDetail } = await import("../api/notices-api")
      vi.mocked(getNoticeDetail).mockResolvedValueOnce({
        noticeId: "notice_01",
        title: "Test Notice",
        body: "Test body",
        state: "published",
        authorId: "admin_01",
        publishedAt: "2026-03-20T00:00:00Z",
        viewCount: 100,
        attachments: [],
        createdAt: "2026-03-20T00:00:00Z",
        updatedAt: "2026-03-20T00:00:00Z",
      })

      const { result } = renderHook(() => useNoticeDetail("notice_01"), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.title).toBe("Test Notice")
    })

    it("does not fetch when noticeId is empty", async () => {
      const { getNoticeDetail } = await import("../api/notices-api")

      const { result } = renderHook(() => useNoticeDetail(""), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.fetchStatus).toBe("idle")
      expect(getNoticeDetail).not.toHaveBeenCalled()
    })
  })

  describe("useCreateNotice", () => {
    it("creates notice and invalidates list", async () => {
      const { createNotice: createNoticeApi } = await import("../api/notices-api")
      vi.mocked(createNoticeApi).mockResolvedValueOnce({
        noticeId: "notice_new",
        state: "draft",
        createdAt: "2026-03-20T00:00:00Z",
      })

      const { result } = renderHook(() => useCreateNotice(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        title: "New Notice",
        body: "New notice body",
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.noticeId).toBe("notice_new")
    })
  })

  describe("useUpdateNotice", () => {
    it("updates notice and invalidates cache", async () => {
      const { updateNotice: updateNoticeApi } = await import("../api/notices-api")
      vi.mocked(updateNoticeApi).mockResolvedValueOnce({
        noticeId: "notice_01",
        state: "draft",
        updatedAt: "2026-03-20T00:00:00Z",
      })

      const { result } = renderHook(() => useUpdateNotice(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        noticeId: "notice_01",
        request: { title: "Updated Title" },
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.noticeId).toBe("notice_01")
    })
  })

  describe("usePublishNotice", () => {
    it("publishes notice", async () => {
      const { publishNotice: publishNoticeApi } = await import("../api/notices-api")
      vi.mocked(publishNoticeApi).mockResolvedValueOnce({
        noticeId: "notice_01",
        state: "published",
        publishedAt: "2026-03-20T00:00:00Z",
      })

      const { result } = renderHook(() => usePublishNotice(), {
        wrapper: createWrapper(),
      })

      result.current.mutate("notice_01")

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.state).toBe("published")
    })
  })

  describe("useArchiveNotice", () => {
    it("archives notice", async () => {
      const { archiveNotice: archiveNoticeApi } = await import("../api/notices-api")
      vi.mocked(archiveNoticeApi).mockResolvedValueOnce({
        noticeId: "notice_01",
        state: "archived",
        archivedAt: "2026-03-20T00:00:00Z",
      })

      const { result } = renderHook(() => useArchiveNotice(), {
        wrapper: createWrapper(),
      })

      result.current.mutate("notice_01")

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.state).toBe("archived")
    })
  })
})
