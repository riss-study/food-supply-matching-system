import type {
  AdminSupplierReviewHiddenFilter,
  AdminSupplierReviewListItem,
  AdminSupplierReviewModerationResponse,
  ApiEnvelope,
  PaginationMeta,
} from "@fsm/types"
import { adminApiClient } from "../../auth/lib/api-client"

export interface GetSupplierReviewsParams {
  hidden?: AdminSupplierReviewHiddenFilter
  supplierId?: string
  page?: number
  size?: number
  sort?: string
  order?: "asc" | "desc"
}

export async function getSupplierReviews(params: GetSupplierReviewsParams = {}) {
  const response = await adminApiClient.get<ApiEnvelope<AdminSupplierReviewListItem[]>>(
    "/api/admin/supplier-reviews",
    { params },
  )
  return {
    items: response.data.data,
    meta: (response.data.meta as PaginationMeta | undefined) ?? {},
  }
}

export async function hideSupplierReview(reviewId: string): Promise<AdminSupplierReviewModerationResponse> {
  const response = await adminApiClient.post<ApiEnvelope<AdminSupplierReviewModerationResponse>>(
    `/api/admin/supplier-reviews/${reviewId}/hide`,
  )
  return response.data.data
}

export async function unhideSupplierReview(reviewId: string): Promise<AdminSupplierReviewModerationResponse> {
  const response = await adminApiClient.post<ApiEnvelope<AdminSupplierReviewModerationResponse>>(
    `/api/admin/supplier-reviews/${reviewId}/unhide`,
  )
  return response.data.data
}
