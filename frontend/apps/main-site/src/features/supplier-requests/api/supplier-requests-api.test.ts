import { describe, expect, it, vi } from "vitest"
import { getSupplierRequestFeed, getSupplierRequestDetail } from "../api/supplier-requests-api"

vi.mock("../../auth/lib/api-client", () => ({
  authApiClient: {
    get: vi.fn(),
  },
}))

describe("supplier-requests-api", () => {
  describe("getSupplierRequestFeed", () => {
    it("returns feed items and meta", async () => {
      const { authApiClient } = await import("../../auth/lib/api-client")
      const mockData = {
        data: {
          data: [
            {
              requestId: "req_01",
              title: "Test Request",
              category: "snack",
              desiredVolume: 1000,
              mode: "public",
              requester: { businessName: "Test Co" },
              createdAt: "2026-03-20T00:00:00Z",
              hasQuoted: false,
            },
          ],
          meta: { page: 1, size: 20, totalElements: 1, totalPages: 1, hasNext: false, hasPrev: false },
        },
      }
      vi.mocked(authApiClient.get).mockResolvedValueOnce(mockData)

      const result = await getSupplierRequestFeed({ category: "snack", page: 1, size: 20 })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].hasQuoted).toBe(false)
      expect(result.meta.page).toBe(1)
    })
  })

  describe("getSupplierRequestDetail", () => {
    it("returns request detail with hasQuoted flag", async () => {
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
            hasQuoted: true,
          },
        },
      }
      vi.mocked(authApiClient.get).mockResolvedValueOnce(mockData)

      const result = await getSupplierRequestDetail("req_01")

      expect(result.requestId).toBe("req_01")
      expect(result.hasQuoted).toBe(true)
    })
  })
})
