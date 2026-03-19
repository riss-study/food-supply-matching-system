import { useQuery } from "@tanstack/react-query"
import { getReviewDetail } from "../api/review-api"

export function useReviewDetail(reviewId: string) {
  return useQuery({
    queryKey: ["admin-review-detail", reviewId],
    queryFn: () => getReviewDetail(reviewId),
    enabled: Boolean(reviewId),
  })
}
