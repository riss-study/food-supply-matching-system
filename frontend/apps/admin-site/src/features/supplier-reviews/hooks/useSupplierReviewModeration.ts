import { useMutation, useQueryClient } from "@tanstack/react-query"
import { hideSupplierReview, unhideSupplierReview } from "../api/supplier-reviews-api"
import { supplierReviewKeys } from "../query-keys"

export function useHideSupplierReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: hideSupplierReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierReviewKeys.all })
    },
  })
}

export function useUnhideSupplierReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: unhideSupplierReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierReviewKeys.all })
    },
  })
}
