import { describe, expect, it, vi } from "vitest"
import {
  getThreadList,
  getThreadDetail,
  createThread,
  sendMessage,
  markThreadAsRead,
  uploadAttachment,
  validateAttachment,
  formatFileSize,
  isPreviewableImage,
  MAX_ATTACHMENT_SIZE,
} from "../api/thread-api"

vi.mock("../../auth/lib/api-client", () => ({
  authApiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe("thread-api", () => {
  describe("getThreadList", () => {
    it("returns threads and meta from response", async () => {
      const { authApiClient } = await import("../../auth/lib/api-client")
      const mockData = {
        data: {
          data: [
            {
              threadId: "thread_01",
              requestId: "req_01",
              requestTitle: "Test Request",
              otherParty: {
                displayName: "Supplier Co",
                role: "supplier",
                profileId: "sprof_01",
              },
              unreadCount: 2,
              contactShareState: "not_requested",
              lastMessage: {
                messageId: "msg_01",
                senderUserId: "user_02",
                body: "Hello",
                hasAttachments: false,
                createdAt: "2026-03-20T00:00:00Z",
              },
              createdAt: "2026-03-20T00:00:00Z",
              updatedAt: "2026-03-20T01:00:00Z",
            },
          ],
          meta: { page: 1, size: 20, totalElements: 1, totalPages: 1, hasNext: false, hasPrev: false },
        },
      }
      vi.mocked(authApiClient.get).mockResolvedValueOnce(mockData)

      const result = await getThreadList({ page: 1, size: 20 })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].threadId).toBe("thread_01")
      expect(result.items[0].unreadCount).toBe(2)
      expect(result.meta.page).toBe(1)
    })
  })

  describe("getThreadDetail", () => {
    it("returns thread detail with messages", async () => {
      const { authApiClient } = await import("../../auth/lib/api-client")
      const mockData = {
        data: {
          data: {
            threadId: "thread_01",
            requestId: "req_01",
            requestTitle: "Test Request",
            otherParty: {
              displayName: "Supplier Co",
              role: "supplier",
              profileId: "sprof_01",
            },
            contactShareState: "not_requested",
            messages: [
              {
                messageId: "msg_01",
                senderUserId: "user_01",
                senderType: "supplier",
                body: "Hello",
                attachments: [],
                createdAt: "2026-03-20T00:00:00Z",
              },
            ],
            createdAt: "2026-03-20T00:00:00Z",
            updatedAt: "2026-03-20T01:00:00Z",
          },
        },
      }
      vi.mocked(authApiClient.get).mockResolvedValueOnce(mockData)

      const result = await getThreadDetail("thread_01")

      expect(result.threadId).toBe("thread_01")
      expect(result.messages).toHaveLength(1)
      expect(result.messages[0].body).toBe("Hello")
    })
  })

  describe("createThread", () => {
    it("creates thread and returns response", async () => {
      const { authApiClient } = await import("../../auth/lib/api-client")
      const mockData = {
        data: {
          data: {
            threadId: "thread_new",
            requestId: "req_01",
            supplierProfileId: "sprof_01",
            createdAt: "2026-03-20T00:00:00Z",
            created: true,
          },
        },
      }
      vi.mocked(authApiClient.post).mockResolvedValueOnce(mockData)

      const result = await createThread("req_01", { supplierId: "sprof_01" })

      expect(result.threadId).toBe("thread_new")
      expect(result.created).toBe(true)
    })
  })

  describe("sendMessage", () => {
    it("sends message with body", async () => {
      const { authApiClient } = await import("../../auth/lib/api-client")
      const mockData = {
        data: {
          data: {
            messageId: "msg_new",
            threadId: "thread_01",
            createdAt: "2026-03-20T00:00:00Z",
          },
        },
      }
      vi.mocked(authApiClient.post).mockResolvedValueOnce(mockData)

      const result = await sendMessage("thread_01", { body: "Test message", attachmentIds: null })

      expect(result.messageId).toBe("msg_new")
      expect(result.threadId).toBe("thread_01")
    })

    it("sends message with attachments", async () => {
      const { authApiClient } = await import("../../auth/lib/api-client")
      const mockData = {
        data: {
          data: {
            messageId: "msg_new",
            threadId: "thread_01",
            createdAt: "2026-03-20T00:00:00Z",
          },
        },
      }
      vi.mocked(authApiClient.post).mockResolvedValueOnce(mockData)

      const result = await sendMessage("thread_01", { body: null, attachmentIds: ["att_01", "att_02"] })

      expect(result.messageId).toBe("msg_new")
    })
  })

  describe("markThreadAsRead", () => {
    it("marks thread as read", async () => {
      const { authApiClient } = await import("../../auth/lib/api-client")
      const mockData = {
        data: {
          data: {
            threadId: "thread_01",
            unreadCount: 0,
            readAt: "2026-03-20T02:00:00Z",
          },
        },
      }
      vi.mocked(authApiClient.post).mockResolvedValueOnce(mockData)

      const result = await markThreadAsRead("thread_01")

      expect(result.threadId).toBe("thread_01")
      expect(result.unreadCount).toBe(0)
    })
  })

  describe("uploadAttachment", () => {
    it("uploads file and returns attachment info", async () => {
      const { authApiClient } = await import("../../auth/lib/api-client")
      const mockData = {
        data: {
          data: {
            attachmentId: "att_new",
            fileName: "test.pdf",
            contentType: "application/pdf",
            fileSize: 1024,
            url: "/api/threads/thread_01/attachments/att_new",
            createdAt: "2026-03-20T00:00:00Z",
          },
        },
      }
      vi.mocked(authApiClient.post).mockResolvedValueOnce(mockData)

      const file = new File(["test"], "test.pdf", { type: "application/pdf" })
      const result = await uploadAttachment("thread_01", file)

      expect(result.attachmentId).toBe("att_new")
      expect(result.fileName).toBe("test.pdf")
    })
  })

  describe("validateAttachment", () => {
    it("validates allowed file types", () => {
      const jpegFile = new File([""], "test.jpg", { type: "image/jpeg" })
      const pngFile = new File([""], "test.png", { type: "image/png" })
      const pdfFile = new File([""], "test.pdf", { type: "application/pdf" })
      const invalidFile = new File([""], "test.exe", { type: "application/x-msdownload" })

      expect(validateAttachment(jpegFile).valid).toBe(true)
      expect(validateAttachment(pngFile).valid).toBe(true)
      expect(validateAttachment(pdfFile).valid).toBe(true)
      expect(validateAttachment(invalidFile).valid).toBe(false)
    })

    it("validates file size", () => {
      const smallFile = new File(["a".repeat(100)], "small.jpg", { type: "image/jpeg" })
      const largeFile = new File(["a".repeat(MAX_ATTACHMENT_SIZE + 1)], "large.jpg", { type: "image/jpeg" })

      expect(validateAttachment(smallFile).valid).toBe(true)
      expect(validateAttachment(largeFile).valid).toBe(false)
    })
  })

  describe("formatFileSize", () => {
    it("formats bytes correctly", () => {
      expect(formatFileSize(0)).toBe("0 B")
      expect(formatFileSize(1024)).toBe("1 KB")
      expect(formatFileSize(1024 * 1024)).toBe("1 MB")
      expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB")
      expect(formatFileSize(1536)).toBe("1.5 KB")
    })
  })

  describe("isPreviewableImage", () => {
    it("returns true for previewable image types", () => {
      expect(isPreviewableImage("image/jpeg")).toBe(true)
      expect(isPreviewableImage("image/png")).toBe(true)
      expect(isPreviewableImage("image/gif")).toBe(true)
      expect(isPreviewableImage("image/webp")).toBe(true)
    })

    it("returns false for non-previewable types", () => {
      expect(isPreviewableImage("application/pdf")).toBe(false)
      expect(isPreviewableImage("image/svg+xml")).toBe(false)
    })
  })
})
