import type {
  ApiEnvelope,
  CreateReviewRequest,
  CreateReviewResponse,
  PaginationMeta,
  ReviewEligibility,
  SupplierReviewListItem,
  UpdateReviewRequest,
  UpdateReviewResponse,
} from "@fsm/types"
import { createApiClient, getApiBaseUrl } from "@fsm/utils"
import { authApiClient } from "../../auth/lib/api-client"

const publicApiClient = createApiClient(getApiBaseUrl())

export async function getReviewEligibility(requestId: string, supplierId: string): Promise<ReviewEligibility> {
  const response = await authApiClient.get<ApiEnvelope<ReviewEligibility>>("/api/reviews/eligibility", {
    params: { requestId, supplierId },
  })
  return response.data.data
}

export async function createReview(request: CreateReviewRequest): Promise<CreateReviewResponse> {
  const response = await authApiClient.post<ApiEnvelope<CreateReviewResponse>>("/api/reviews", request)
  return response.data.data
}

export async function updateReview(reviewId: string, request: UpdateReviewRequest): Promise<UpdateReviewResponse> {
  const response = await authApiClient.patch<ApiEnvelope<UpdateReviewResponse>>(`/api/reviews/${reviewId}`, request)
  return response.data.data
}

export async function getSupplierReviews(supplierId: string, params: { page?: number; size?: number; sort?: string; order?: string } = {}) {
  const response = await publicApiClient.get<ApiEnvelope<SupplierReviewListItem[]>>(`/api/suppliers/${supplierId}/reviews`, { params })
  return {
    items: response.data.data,
    meta: (response.data.meta as PaginationMeta | undefined) ?? {},
  }
}
