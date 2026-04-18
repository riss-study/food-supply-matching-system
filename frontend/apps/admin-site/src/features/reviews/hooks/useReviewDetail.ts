import { useQuery } from "@tanstack/react-query"
import { getReviewDetail } from "../api/review-api"
import { adminReviewKeys } from "../query-keys"

export function useReviewDetail(reviewId: string) {
  return useQuery({
    queryKey: adminReviewKeys.detail(reviewId),
    queryFn: () => getReviewDetail(reviewId),
    enabled: Boolean(reviewId),
  })
}
