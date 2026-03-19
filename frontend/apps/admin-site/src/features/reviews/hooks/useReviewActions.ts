import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { ReviewDecisionRequest } from "@fsm/types"
import { approveReview, holdReview, rejectReview } from "../api/review-api"

function useRefresh(reviewId: string) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ["admin-review-queue"] })
    queryClient.invalidateQueries({ queryKey: ["admin-review-detail", reviewId] })
  }
}

export function useApproveReview(reviewId: string) {
  const refresh = useRefresh(reviewId)
  return useMutation({ mutationFn: (request: ReviewDecisionRequest) => approveReview(reviewId, request), onSuccess: refresh })
}

export function useHoldReview(reviewId: string) {
  const refresh = useRefresh(reviewId)
  return useMutation({ mutationFn: (request: ReviewDecisionRequest) => holdReview(reviewId, request), onSuccess: refresh })
}

export function useRejectReview(reviewId: string) {
  const refresh = useRefresh(reviewId)
  return useMutation({ mutationFn: (request: ReviewDecisionRequest) => rejectReview(reviewId, request), onSuccess: refresh })
}
