import { useQuery } from "@tanstack/react-query"
import type { GetSupplierReviewsParams } from "../api/supplier-reviews-api"
import { getSupplierReviews } from "../api/supplier-reviews-api"
import { supplierReviewKeys } from "../query-keys"

export function useSupplierReviews(params: GetSupplierReviewsParams = {}) {
  return useQuery({
    queryKey: supplierReviewKeys.list(params as Record<string, unknown>),
    queryFn: () => getSupplierReviews(params),
    staleTime: 30_000,
  })
}
