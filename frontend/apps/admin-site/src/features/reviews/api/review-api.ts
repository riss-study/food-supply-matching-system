import type { AdminReviewDetail, AdminReviewQueueItem, ApiEnvelope, PaginationMeta, ReviewDecisionRequest, ReviewDecisionResponse } from "@fsm/types"
import { adminApiClient } from "../../auth/lib/api-client"

export async function getReviewQueue(state?: string) {
  const response = await adminApiClient.get<ApiEnvelope<AdminReviewQueueItem[]>>("/api/admin/reviews", {
    params: { state },
  })
  return {
    items: response.data.data,
    meta: response.data.meta as PaginationMeta | undefined,
  }
}

export async function getReviewDetail(reviewId: string): Promise<AdminReviewDetail> {
  const response = await adminApiClient.get<ApiEnvelope<AdminReviewDetail>>(`/api/admin/reviews/${reviewId}`)
  return response.data.data
}

export async function approveReview(reviewId: string, request: ReviewDecisionRequest): Promise<ReviewDecisionResponse> {
  const response = await adminApiClient.post<ApiEnvelope<ReviewDecisionResponse>>(`/api/admin/reviews/${reviewId}/approve`, request)
  return response.data.data
}

export async function holdReview(reviewId: string, request: ReviewDecisionRequest): Promise<ReviewDecisionResponse> {
  const response = await adminApiClient.post<ApiEnvelope<ReviewDecisionResponse>>(`/api/admin/reviews/${reviewId}/hold`, request)
  return response.data.data
}

export async function rejectReview(reviewId: string, request: ReviewDecisionRequest): Promise<ReviewDecisionResponse> {
  const response = await adminApiClient.post<ApiEnvelope<ReviewDecisionResponse>>(`/api/admin/reviews/${reviewId}/reject`, request)
  return response.data.data
}
