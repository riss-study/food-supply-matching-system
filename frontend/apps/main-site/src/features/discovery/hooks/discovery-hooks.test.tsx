import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useSupplierCategories, useSupplierRegions } from "../hooks/useDiscoveryLookups"
import { useSupplierDetail } from "../hooks/useSupplierDetail"
import { useSupplierList } from "../hooks/useSupplierList"
import { discoveryKeys } from "../query-keys"

vi.mock("../api/discovery-api", () => ({
  getSupplierList: vi.fn(),
  getSupplierDetail: vi.fn(),
  getSupplierCategories: vi.fn(),
  getSupplierRegions: vi.fn(),
}))

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe("discovery hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("useSupplierCategories", () => {
    it("fetches supplier categories", async () => {
      const { getSupplierCategories } = await import("../api/discovery-api")
      vi.mocked(getSupplierCategories).mockResolvedValueOnce([
        { category: "snack", supplierCount: 5 },
        { category: "beverage", supplierCount: 3 },
      ])

      const { result } = renderHook(() => useSupplierCategories(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toHaveLength(2)
      expect(result.current.data?.[0].category).toBe("snack")
    })
  })

  describe("useSupplierRegions", () => {
    it("fetches supplier regions", async () => {
      const { getSupplierRegions } = await import("../api/discovery-api")
      vi.mocked(getSupplierRegions).mockResolvedValueOnce([
        { region: "서울", supplierCount: 4 },
        { region: "경기", supplierCount: 2 },
      ])

      const { result } = renderHook(() => useSupplierRegions(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toHaveLength(2)
      expect(result.current.data?.[0].region).toBe("서울")
    })
  })

  describe("useSupplierList", () => {
    it("fetches supplier list with params", async () => {
      const { getSupplierList } = await import("../api/discovery-api")
      vi.mocked(getSupplierList).mockResolvedValueOnce({
        items: [
          {
            profileId: "sprof_01",
            companyName: "예시식품",
            region: "서울",
            categories: ["snack"],
            monthlyCapacity: "1000",
            moq: "500",
            oemAvailable: true,
            odmAvailable: false,
            verificationState: "verified",
            exposureState: "visible",
            logoUrl: null,
          },
        ],
        meta: { page: 1, size: 20, totalElements: 1, totalPages: 1, hasNext: false, hasPrev: false },
      })

      const params = { category: "snack", page: 1, size: 20 }
      const { result } = renderHook(() => useSupplierList(params), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.items[0].profileId).toBe("sprof_01")
      expect(getSupplierList).toHaveBeenCalledWith(params)
    })

    it("uses params-based query key factory", () => {
      const params = { category: "snack", page: 2 }
      const key = discoveryKeys.supplierList(params)
      expect(key).toEqual(["discovery", "supplier-list", params])
    })
  })

  describe("useSupplierDetail", () => {
    it("fetches supplier detail", async () => {
      const { getSupplierDetail } = await import("../api/discovery-api")
      vi.mocked(getSupplierDetail).mockResolvedValueOnce({
        profileId: "sprof_01",
        companyName: "예시식품",
        representativeName: "홍길동",
        region: "서울",
        categories: ["snack"],
        equipmentSummary: null,
        monthlyCapacity: "1000",
        moq: "500",
        oemAvailable: true,
        odmAvailable: false,
        rawMaterialSupport: false,
        packagingLabelingSupport: false,
        introduction: null,
        verificationState: "verified",
        logoUrl: null,
        certifications: [],
        portfolioImages: [],
      })

      const { result } = renderHook(() => useSupplierDetail("sprof_01"), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.profileId).toBe("sprof_01")
    })

    it("does not fetch when profileId is empty", async () => {
      const { getSupplierDetail } = await import("../api/discovery-api")

      const { result } = renderHook(() => useSupplierDetail(""), { wrapper: createWrapper() })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.fetchStatus).toBe("idle")
      expect(getSupplierDetail).not.toHaveBeenCalled()
    })
  })
})
