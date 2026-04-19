import { useQuery } from "@tanstack/react-query"
import { getReviewEligibility } from "../api/reviews-api"
import { reviewKeys } from "../query-keys"

export function useReviewEligibility(requestId: string | undefined, supplierId: string | undefined) {
  return useQuery({
    queryKey: reviewKeys.eligibility(requestId ?? "", supplierId ?? ""),
    queryFn: () => getReviewEligibility(requestId!, supplierId!),
    enabled: Boolean(requestId && supplierId),
    staleTime: 30_000,
  })
}
