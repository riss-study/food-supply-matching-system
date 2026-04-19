import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UpdateReviewRequest } from "@fsm/types"
import { updateReview } from "../api/reviews-api"
import { reviewKeys } from "../query-keys"

export function useUpdateReview(supplierId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, request }: { reviewId: string; request: UpdateReviewRequest }) =>
      updateReview(reviewId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all })
      if (supplierId) {
        queryClient.invalidateQueries({ queryKey: reviewKeys.supplierReviews(supplierId) })
      }
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
    },
  })
}
