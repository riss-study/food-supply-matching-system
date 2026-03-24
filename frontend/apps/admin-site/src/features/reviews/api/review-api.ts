import type { AdminReviewDetail, AdminReviewQueueItem, ApiEnvelope, PaginationMeta, ReviewDecisionRequest, ReviewDecisionResponse } from "@fsm/types"
import { adminApiClient } from "../../auth/lib/api-client"

export interface GetReviewQueueParams {
  state?: string
  fromDate?: string
  toDate?: string
  page?: number
  size?: number
  sort?: string
  order?: "asc" | "desc"
}

export async function getReviewQueue(params: GetReviewQueueParams = {}) {
  const response = await adminApiClient.get<ApiEnvelope<AdminReviewQueueItem[]>>("/api/admin/reviews", {
    params: {
      state: params.state,
      fromDate: params.fromDate,
      toDate: params.toDate,
      page: params.page,
      size: params.size,
      sort: params.sort,
      order: params.order,
    },
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
