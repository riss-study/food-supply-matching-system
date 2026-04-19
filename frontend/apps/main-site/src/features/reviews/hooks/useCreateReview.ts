import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createReview } from "../api/reviews-api"
import { reviewKeys } from "../query-keys"

export function useCreateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createReview,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all })
      queryClient.invalidateQueries({ queryKey: reviewKeys.supplierReviews(variables.supplierId) })
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
    },
  })
}
