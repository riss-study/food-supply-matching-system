import type {
  ApiEnvelope,
  PaginationMeta,
  SupplierCategorySummaryResponse,
  SupplierDetailResponse,
  SupplierRegionSummaryResponse,
  SupplierSearchItemResponse,
} from "@fsm/types"
import { authApiClient } from "../../auth/lib/api-client"

export async function getSupplierList(params: Record<string, string | number | boolean | undefined>) {
  const response = await authApiClient.get<ApiEnvelope<SupplierSearchItemResponse[]>>("/api/suppliers", { params })
  return {
    items: response.data.data,
    meta: (response.data.meta as PaginationMeta | undefined) ?? {},
  }
}

export async function getSupplierDetail(profileId: string): Promise<SupplierDetailResponse> {
  const response = await authApiClient.get<ApiEnvelope<SupplierDetailResponse>>(`/api/suppliers/${profileId}`)
  return response.data.data
}

export async function getSupplierCategories(): Promise<SupplierCategorySummaryResponse[]> {
  const response = await authApiClient.get<ApiEnvelope<SupplierCategorySummaryResponse[]>>("/api/suppliers/categories")
  return response.data.data
}

export async function getSupplierRegions(): Promise<SupplierRegionSummaryResponse[]> {
  const response = await authApiClient.get<ApiEnvelope<SupplierRegionSummaryResponse[]>>("/api/suppliers/regions")
  return response.data.data
}
