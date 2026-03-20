import type {
  ApiEnvelope,
  PaginationMeta,
  SupplierRequestDetail,
  SupplierRequestFeedItem,
} from "@fsm/types"
import { authApiClient } from "../../auth/lib/api-client"

export async function getSupplierRequestFeed(params: { category?: string; page?: number; size?: number }) {
  const response = await authApiClient.get<ApiEnvelope<SupplierRequestFeedItem[]>>("/api/supplier/requests", { params })
  return {
    items: response.data.data,
    meta: (response.data.meta as PaginationMeta | undefined) ?? {},
  }
}

export async function getSupplierRequestDetail(requestId: string): Promise<SupplierRequestDetail> {
  const response = await authApiClient.get<ApiEnvelope<SupplierRequestDetail>>(`/api/supplier/requests/${requestId}`)
  return response.data.data
}
