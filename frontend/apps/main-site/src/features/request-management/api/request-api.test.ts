import { describe, expect, it, vi } from "vitest"
import {
  cancelRequest,
  closeRequest,
  createRequest,
  getRequestDetail,
  getRequestList,
  updateRequest,
} from "../api/request-api"

vi.mock("../../auth/lib/api-client", () => ({
  authApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe("request-api", () => {
  describe("getRequestList", () => {
    it("returns items and meta from response", async () => {
      const { authApiClient } = await import("../../auth/lib/api-client")
      const mockData = {
        data: {
          data: [
            {
              requestId: "req_01",
              title: "Test Request",
              category: "snack",
              state: "open",
              mode: "public",
              quoteCount: 0,
              createdAt: "2026-03-20T00:00:00Z",
            },
          ],
          meta: { page: 1, size: 20, totalElements: 1, totalPages: 1, hasNext: false, hasPrev: false },
        },
      }
      vi.mocked(authApiClient.get).mockResolvedValueOnce(mockData)

      const result = await getRequestList({ state: "open", page: 1, size: 20 })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].requestId).toBe("req_01")
      expect(result.meta.page).toBe(1)
    })
  })

  describe("getRequestDetail", () => {
    it("returns request detail", async () => {
      const { authApiClient } = await import("../../auth/lib/api-client")
      const mockData = {
        data: {
          data: {
            requestId: "req_01",
            mode: "public",
            title: "Test Request",
            category: "snack",
            desiredVolume: 1000,
            certificationRequirement: [],
            state: "open",
            requester: { businessName: "Test Co", contactName: "John" },
            createdAt: "2026-03-20T00:00:00Z",
            targetSuppliers: [],
          },
        },
      }
      vi.mocked(authApiClient.get).mockResolvedValueOnce(mockData)

      const result = await getRequestDetail("req_01")

      expect(result.requestId).toBe("req_01")
      expect(result.title).toBe("Test Request")
    })
  })

  describe("createRequest", () => {
    it("creates request and returns response", async () => {
      const { authApiClient } = await import("../../auth/lib/api-client")
      const mockData = {
        data: {
          data: {
            requestId: "req_new",
            state: "draft",
            createdAt: "2026-03-20T00:00:00Z",
          },
        },
      }
      vi.mocked(authApiClient.post).mockResolvedValueOnce(mockData)

      const result = await createRequest({
        mode: "public",
        title: "New Request",
        category: "snack",
        desiredVolume: 1000,
      })

      expect(result.requestId).toBe("req_new")
      expect(result.state).toBe("draft")
    })
  })

  describe("updateRequest", () => {
    it("updates request and returns response", async () => {
      const { authApiClient } = await import("../../auth/lib/api-client")
      const mockData = {
        data: {
          data: {
            requestId: "req_01",
            state: "open",
            updatedAt: "2026-03-20T01:00:00Z",
          },
        },
      }
      vi.mocked(authApiClient.patch).mockResolvedValueOnce(mockData)

      const result = await updateRequest("req_01", { title: "Updated Title" })

      expect(result.requestId).toBe("req_01")
      expect(result.updatedAt).toBe("2026-03-20T01:00:00Z")
    })
  })

  describe("closeRequest", () => {
    it("closes request and returns response", async () => {
      const { authApiClient } = await import("../../auth/lib/api-client")
      const mockData = {
        data: {
          data: {
            requestId: "req_01",
            state: "closed",
            closedAt: "2026-03-20T02:00:00Z",
          },
        },
      }
      vi.mocked(authApiClient.post).mockResolvedValueOnce(mockData)

      const result = await closeRequest("req_01")

      expect(result.state).toBe("closed")
      expect(result.closedAt).toBe("2026-03-20T02:00:00Z")
    })
  })

  describe("cancelRequest", () => {
    it("cancels request and returns response", async () => {
      const { authApiClient } = await import("../../auth/lib/api-client")
      const mockData = {
        data: {
          data: {
            requestId: "req_01",
            state: "cancelled",
            cancelledAt: "2026-03-20T03:00:00Z",
          },
        },
      }
      vi.mocked(authApiClient.post).mockResolvedValueOnce(mockData)

      const result = await cancelRequest("req_01", { reason: "Project cancelled" })

      expect(result.state).toBe("cancelled")
      expect(result.cancelledAt).toBe("2026-03-20T03:00:00Z")
    })
  })
})
