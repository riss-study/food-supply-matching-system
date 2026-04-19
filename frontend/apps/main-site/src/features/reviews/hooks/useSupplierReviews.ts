import { useQuery } from "@tanstack/react-query"
import { getSupplierReviews } from "../api/reviews-api"
import { reviewKeys } from "../query-keys"

export function useSupplierReviews(supplierId: string, page = 1, size = 20) {
  return useQuery({
    queryKey: reviewKeys.supplierReviewsList(supplierId, page, size),
    queryFn: () => getSupplierReviews(supplierId, { page, size }),
    staleTime: 60_000,
  })
}
