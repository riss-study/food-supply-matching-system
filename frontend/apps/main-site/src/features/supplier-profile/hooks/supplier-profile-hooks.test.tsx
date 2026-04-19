import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useCreateSupplierProfile } from "../hooks/useCreateSupplierProfile"
import { useLatestVerificationSubmission } from "../hooks/useLatestVerificationSubmission"
import { useSubmitVerification } from "../hooks/useSubmitVerification"
import { useSupplierProfile } from "../hooks/useSupplierProfile"
import { useUpdateSupplierProfile } from "../hooks/useUpdateSupplierProfile"
import { supplierProfileKeys } from "../query-keys"

vi.mock("../api/supplier-profile-api", () => ({
  createSupplierProfile: vi.fn(),
  getSupplierProfile: vi.fn(),
  updateSupplierProfile: vi.fn(),
  submitVerification: vi.fn(),
  getLatestVerificationSubmission: vi.fn(),
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
}

const sampleProfile = {
  profileId: "sprof_01",
  companyName: "예시식품",
  representativeName: "홍길동",
  contactPhone: "010-0000-0000",
  contactEmail: "test@example.com",
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
  verificationState: "draft" as const,
  exposureState: "hidden" as const,
  certifications: [],
  createdAt: "2026-03-20T00:00:00Z",
  updatedAt: "2026-03-20T00:00:00Z",
}

const sampleCreateRequest = {
  companyName: "예시식품",
  representativeName: "홍길동",
  region: "서울",
  categories: ["snack"],
  monthlyCapacity: "1000",
  moq: "500",
  oemAvailable: true,
  odmAvailable: false,
  rawMaterialSupport: false,
  packagingLabelingSupport: false,
}

describe("supplier-profile hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("useSupplierProfile", () => {
    it("fetches current supplier profile", async () => {
      const { getSupplierProfile } = await import("../api/supplier-profile-api")
      vi.mocked(getSupplierProfile).mockResolvedValueOnce(sampleProfile)

      const { result } = renderHook(() => useSupplierProfile(), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.profileId).toBe("sprof_01")
    })
  })

  describe("useLatestVerificationSubmission", () => {
    it("fetches latest verification submission", async () => {
      const { getLatestVerificationSubmission } = await import("../api/supplier-profile-api")
      vi.mocked(getLatestVerificationSubmission).mockResolvedValueOnce({
        submissionId: "vsub_01",
        state: "submitted",
        submittedAt: "2026-03-20T00:00:00Z",
        reviewedAt: null,
        reviewNotePublic: null,
        files: [],
      })

      const { result } = renderHook(() => useLatestVerificationSubmission(), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.submissionId).toBe("vsub_01")
    })

    it("returns null when no submission exists", async () => {
      const { getLatestVerificationSubmission } = await import("../api/supplier-profile-api")
      vi.mocked(getLatestVerificationSubmission).mockResolvedValueOnce(null)

      const { result } = renderHook(() => useLatestVerificationSubmission(), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toBeNull()
    })
  })

  describe("useCreateSupplierProfile", () => {
    it("creates profile successfully", async () => {
      const { createSupplierProfile } = await import("../api/supplier-profile-api")
      vi.mocked(createSupplierProfile).mockResolvedValueOnce(sampleProfile)

      const { result } = renderHook(() => useCreateSupplierProfile(), { wrapper })
      result.current.mutate(sampleCreateRequest)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.profileId).toBe("sprof_01")
    })

    it("invalidates profile queries on success", async () => {
      const { createSupplierProfile } = await import("../api/supplier-profile-api")
      vi.mocked(createSupplierProfile).mockResolvedValueOnce(sampleProfile)
      const queryClient = createTestQueryClient()
      const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(() => useCreateSupplierProfile(), {
        wrapper: createWrapper(queryClient),
      })
      result.current.mutate(sampleCreateRequest)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: supplierProfileKeys.all })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: supplierProfileKeys.latestVerification() })
    })
  })

  describe("useUpdateSupplierProfile", () => {
    it("updates profile and invalidates profile queries", async () => {
      const { updateSupplierProfile } = await import("../api/supplier-profile-api")
      vi.mocked(updateSupplierProfile).mockResolvedValueOnce({ ...sampleProfile, companyName: "변경식품" })
      const queryClient = createTestQueryClient()
      const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(() => useUpdateSupplierProfile(), {
        wrapper: createWrapper(queryClient),
      })
      result.current.mutate({ companyName: "변경식품" })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.companyName).toBe("변경식품")
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: supplierProfileKeys.all })
    })
  })

  describe("useSubmitVerification", () => {
    it("submits verification and invalidates related queries", async () => {
      const { submitVerification } = await import("../api/supplier-profile-api")
      vi.mocked(submitVerification).mockResolvedValueOnce({
        submissionId: "vsub_new",
        state: "submitted",
        submittedAt: "2026-03-20T00:00:00Z",
        fileCount: 1,
      })
      const queryClient = createTestQueryClient()
      const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries")

      const { result } = renderHook(() => useSubmitVerification(), {
        wrapper: createWrapper(queryClient),
      })
      result.current.mutate({
        businessRegistrationDoc: new File(["dummy"], "biz.pdf", { type: "application/pdf" }),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.submissionId).toBe("vsub_new")
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: supplierProfileKeys.all })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: supplierProfileKeys.latestVerification() })
    })
  })
})
