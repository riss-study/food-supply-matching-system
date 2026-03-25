import { describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactNode } from "react"
import { useThreads } from "../hooks/useThreads"
import { useThreadDetail } from "../hooks/useThreadDetail"
import { useSendMessage } from "../hooks/useSendMessage"
import { useMarkThreadRead } from "../hooks/useMarkThreadRead"
import { useCreateThread } from "../hooks/useCreateThread"
import { useRequestContactShare } from "../hooks/useRequestContactShare"
import { useApproveContactShare } from "../hooks/useApproveContactShare"
import { useRevokeContactShare } from "../hooks/useRevokeContactShare"

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
)

const createWrapper = (queryClient: QueryClient) =>
  ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

vi.mock("../api/thread-api", () => ({
  getThreadList: vi.fn(),
  getThreadDetail: vi.fn(),
  sendMessage: vi.fn(),
  markThreadAsRead: vi.fn(),
  createThread: vi.fn(),
  requestContactShare: vi.fn(),
  approveContactShare: vi.fn(),
  revokeContactShare: vi.fn(),
}))

describe("threads hooks", () => {
  it("fetches thread list", async () => {
    const { getThreadList } = await import("../api/thread-api")
    vi.mocked(getThreadList).mockResolvedValueOnce({
      items: [{ threadId: "thread_01", requestId: "req_01", requestTitle: "Test Request", otherParty: { displayName: "Supplier Co", role: "supplier", profileId: "sprof_01" }, unreadCount: 0, contactShareState: "not_requested", createdAt: "2026-03-20T00:00:00Z", updatedAt: "2026-03-20T01:00:00Z" }],
      meta: { page: 1, size: 20, totalElements: 1, totalPages: 1, hasNext: false, hasPrev: false },
    })

    const { result } = renderHook(() => useThreads(), { wrapper })
    await waitFor(() => expect(result.current.data?.items).toHaveLength(1))
  })

  it("fetches thread detail", async () => {
    const { getThreadDetail } = await import("../api/thread-api")
    vi.mocked(getThreadDetail).mockResolvedValueOnce({
      threadId: "thread_01",
      requestId: "req_01",
      requestTitle: "Test Request",
      otherParty: { displayName: "Supplier Co", role: "supplier", profileId: "sprof_01" },
      contactShareState: "not_requested",
      contactShareRequestedByRole: null,
      requesterApproved: false,
      supplierApproved: false,
      sharedContact: null,
      messages: [],
      createdAt: "2026-03-20T00:00:00Z",
      updatedAt: "2026-03-20T01:00:00Z",
    })

    const { result } = renderHook(() => useThreadDetail("thread_01"), { wrapper })
    await waitFor(() => expect(result.current.data?.threadId).toBe("thread_01"))
  })

  it("does not fetch when threadId is empty", () => {
    const { result } = renderHook(() => useThreadDetail(""), { wrapper })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe("idle")
  })

  it("sends message successfully", async () => {
    const { sendMessage } = await import("../api/thread-api")
    vi.mocked(sendMessage).mockResolvedValueOnce({ messageId: "msg_new", threadId: "thread_01", createdAt: "2026-03-20T00:00:00Z" })

    const { result } = renderHook(() => useSendMessage("thread_01"), { wrapper })
    result.current.mutate({ body: "Test message", attachmentIds: null })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it("marks thread as read successfully", async () => {
    const { markThreadAsRead } = await import("../api/thread-api")
    vi.mocked(markThreadAsRead).mockResolvedValueOnce({ threadId: "thread_01", unreadCount: 0, readAt: "2026-03-20T02:00:00Z" })

    const { result } = renderHook(() => useMarkThreadRead(), { wrapper })
    result.current.mutate("thread_01")
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it("creates thread successfully", async () => {
    const { createThread } = await import("../api/thread-api")
    vi.mocked(createThread).mockResolvedValueOnce({ threadId: "thread_new", requestId: "req_01", supplierProfileId: "sprof_01", createdAt: "2026-03-20T00:00:00Z", created: true })

    const { result } = renderHook(() => useCreateThread("req_01"), { wrapper })
    result.current.mutate({ supplierId: "sprof_01" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it("requests contact share successfully", async () => {
    const { requestContactShare } = await import("../api/thread-api")
    vi.mocked(requestContactShare).mockResolvedValueOnce({ threadId: "thread_01", contactShareState: "requested", contactShareRequestedByRole: "requester", requesterApproved: false, supplierApproved: false, sharedContact: null })

    const { result } = renderHook(() => useRequestContactShare("thread_01"), { wrapper })
    result.current.mutate()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it("request contact share invalidates thread detail and list queries", async () => {
    const { requestContactShare } = await import("../api/thread-api")
    vi.mocked(requestContactShare).mockResolvedValueOnce({ threadId: "thread_01", contactShareState: "requested", contactShareRequestedByRole: "requester", requesterApproved: false, supplierApproved: false, sharedContact: null })
    const queryClient = createTestQueryClient()
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries")

    const { result } = renderHook(() => useRequestContactShare("thread_01"), {
      wrapper: createWrapper(queryClient),
    })
    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["threads", "detail", "thread_01"] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["threads", "list"] })
  })

  it("approves contact share successfully", async () => {
    const { approveContactShare } = await import("../api/thread-api")
    vi.mocked(approveContactShare).mockResolvedValueOnce({ threadId: "thread_01", contactShareState: "one_side_approved", contactShareRequestedByRole: "requester", requesterApproved: false, supplierApproved: true, sharedContact: null })

    const { result } = renderHook(() => useApproveContactShare("thread_01"), { wrapper })
    result.current.mutate()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it("approve contact share invalidates thread detail and list queries", async () => {
    const { approveContactShare } = await import("../api/thread-api")
    vi.mocked(approveContactShare).mockResolvedValueOnce({ threadId: "thread_01", contactShareState: "one_side_approved", contactShareRequestedByRole: "requester", requesterApproved: false, supplierApproved: true, sharedContact: null })
    const queryClient = createTestQueryClient()
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries")

    const { result } = renderHook(() => useApproveContactShare("thread_01"), {
      wrapper: createWrapper(queryClient),
    })
    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["threads", "detail", "thread_01"] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["threads", "list"] })
  })

  it("revokes contact share successfully", async () => {
    const { revokeContactShare } = await import("../api/thread-api")
    vi.mocked(revokeContactShare).mockResolvedValueOnce({ threadId: "thread_01", contactShareState: "revoked", contactShareRequestedByRole: "requester", requesterApproved: false, supplierApproved: false, sharedContact: null })

    const { result } = renderHook(() => useRevokeContactShare("thread_01"), { wrapper })
    result.current.mutate()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it("revoke contact share invalidates thread detail and list queries", async () => {
    const { revokeContactShare } = await import("../api/thread-api")
    vi.mocked(revokeContactShare).mockResolvedValueOnce({ threadId: "thread_01", contactShareState: "revoked", contactShareRequestedByRole: "requester", requesterApproved: false, supplierApproved: false, sharedContact: null })
    const queryClient = createTestQueryClient()
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries")

    const { result } = renderHook(() => useRevokeContactShare("thread_01"), {
      wrapper: createWrapper(queryClient),
    })
    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["threads", "detail", "thread_01"] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["threads", "list"] })
  })
})
