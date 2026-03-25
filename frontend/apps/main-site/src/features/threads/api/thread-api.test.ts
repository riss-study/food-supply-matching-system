import { describe, expect, it, vi } from "vitest"
import {
  approveContactShare,
  createThread,
  formatFileSize,
  getThreadDetail,
  getThreadList,
  isPreviewableImage,
  markThreadAsRead,
  requestContactShare,
  revokeContactShare,
  sendMessage,
  uploadAttachment,
  validateAttachment,
  MAX_ATTACHMENT_SIZE,
} from "../api/thread-api"

vi.mock("../../auth/lib/api-client", () => ({
  authApiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe("thread-api", () => {
  it("returns threads and meta from response", async () => {
    const { authApiClient } = await import("../../auth/lib/api-client")
    vi.mocked(authApiClient.get).mockResolvedValueOnce({
      data: { data: [{ threadId: "thread_01", requestId: "req_01", requestTitle: "Test Request", otherParty: { displayName: "Supplier Co", role: "supplier", profileId: "sprof_01" }, unreadCount: 2, contactShareState: "not_requested", lastMessage: { messageId: "msg_01", senderUserId: "user_02", body: "Hello", hasAttachments: false, createdAt: "2026-03-20T00:00:00Z" }, createdAt: "2026-03-20T00:00:00Z", updatedAt: "2026-03-20T01:00:00Z" }], meta: { page: 1, size: 20, totalElements: 1, totalPages: 1, hasNext: false, hasPrev: false } },
    })

    const result = await getThreadList({ page: 1, size: 20 })
    expect(result.items[0].threadId).toBe("thread_01")
    expect(result.meta.page).toBe(1)
  })

  it("returns thread detail with messages", async () => {
    const { authApiClient } = await import("../../auth/lib/api-client")
    vi.mocked(authApiClient.get).mockResolvedValueOnce({
      data: { data: { threadId: "thread_01", requestId: "req_01", requestTitle: "Test Request", otherParty: { displayName: "Supplier Co", role: "supplier", profileId: "sprof_01" }, contactShareState: "not_requested", contactShareRequestedByRole: null, requesterApproved: false, supplierApproved: false, sharedContact: null, messages: [{ messageId: "msg_01", senderUserId: "user_01", senderType: "supplier", body: "Hello", attachments: [], createdAt: "2026-03-20T00:00:00Z" }], createdAt: "2026-03-20T00:00:00Z", updatedAt: "2026-03-20T01:00:00Z" } },
    })

    const result = await getThreadDetail("thread_01")
    expect(result.messages).toHaveLength(1)
  })

  it("creates thread and returns response", async () => {
    const { authApiClient } = await import("../../auth/lib/api-client")
    vi.mocked(authApiClient.post).mockResolvedValueOnce({ data: { data: { threadId: "thread_new", requestId: "req_01", supplierProfileId: "sprof_01", createdAt: "2026-03-20T00:00:00Z", created: true } } })
    const result = await createThread("req_01", { supplierId: "sprof_01" })
    expect(result.created).toBe(true)
  })

  it("sends message with body", async () => {
    const { authApiClient } = await import("../../auth/lib/api-client")
    vi.mocked(authApiClient.post).mockResolvedValueOnce({ data: { data: { messageId: "msg_new", threadId: "thread_01", createdAt: "2026-03-20T00:00:00Z" } } })
    const result = await sendMessage("thread_01", { body: "Test message", attachmentIds: null })
    expect(result.messageId).toBe("msg_new")
  })

  it("marks thread as read", async () => {
    const { authApiClient } = await import("../../auth/lib/api-client")
    vi.mocked(authApiClient.post).mockResolvedValueOnce({ data: { data: { threadId: "thread_01", unreadCount: 0, readAt: "2026-03-20T02:00:00Z" } } })
    const result = await markThreadAsRead("thread_01")
    expect(result.unreadCount).toBe(0)
  })

  it("uploads file and returns attachment info", async () => {
    const { authApiClient } = await import("../../auth/lib/api-client")
    vi.mocked(authApiClient.post).mockResolvedValueOnce({ data: { data: { attachmentId: "att_new", fileName: "test.pdf", contentType: "application/pdf", fileSize: 1024, url: "/api/threads/thread_01/attachments/att_new", createdAt: "2026-03-20T00:00:00Z" } } })
    const file = new File(["test"], "test.pdf", { type: "application/pdf" })
    const result = await uploadAttachment("thread_01", file)
    expect(result.attachmentId).toBe("att_new")
  })

  it("requests contact sharing", async () => {
    const { authApiClient } = await import("../../auth/lib/api-client")
    vi.mocked(authApiClient.post).mockResolvedValueOnce({ data: { data: { threadId: "thread_01", contactShareState: "requested", contactShareRequestedByRole: "requester", requesterApproved: false, supplierApproved: false, sharedContact: null } } })
    const result = await requestContactShare("thread_01")
    expect(result.contactShareState).toBe("requested")
  })

  it("approves contact sharing and returns shared contact", async () => {
    const { authApiClient } = await import("../../auth/lib/api-client")
    vi.mocked(authApiClient.post).mockResolvedValueOnce({ data: { data: { threadId: "thread_01", contactShareState: "mutually_approved", contactShareRequestedByRole: "requester", requesterApproved: true, supplierApproved: true, sharedContact: { requester: { name: "요청자", phone: "010-1111-2222", email: "req@test.com" }, supplier: { name: "공급자", phone: "010-3333-4444", email: "sup@test.com" } } } } })
    const result = await approveContactShare("thread_01")
    expect(result.sharedContact?.supplier.email).toBe("sup@test.com")
  })

  it("revokes contact sharing", async () => {
    const { authApiClient } = await import("../../auth/lib/api-client")
    vi.mocked(authApiClient.post).mockResolvedValueOnce({ data: { data: { threadId: "thread_01", contactShareState: "revoked", contactShareRequestedByRole: "requester", requesterApproved: false, supplierApproved: false, sharedContact: null } } })
    const result = await revokeContactShare("thread_01")
    expect(result.contactShareState).toBe("revoked")
  })

  it("validates allowed file types and size", () => {
    const jpegFile = new File([""], "test.jpg", { type: "image/jpeg" })
    const invalidFile = new File([""], "test.exe", { type: "application/x-msdownload" })
    const largeFile = new File(["a".repeat(MAX_ATTACHMENT_SIZE + 1)], "large.jpg", { type: "image/jpeg" })
    expect(validateAttachment(jpegFile).valid).toBe(true)
    expect(validateAttachment(invalidFile).valid).toBe(false)
    expect(validateAttachment(largeFile).valid).toBe(false)
  })

  it("formats file size and previewable type", () => {
    expect(formatFileSize(1024)).toBe("1 KB")
    expect(isPreviewableImage("image/gif")).toBe(true)
    expect(isPreviewableImage("application/pdf")).toBe(false)
  })
})
