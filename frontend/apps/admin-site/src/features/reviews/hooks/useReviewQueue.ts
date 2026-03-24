import { useQuery } from "@tanstack/react-query"
import { getReviewQueue, type GetReviewQueueParams } from "../api/review-api"

export function useReviewQueue(params: GetReviewQueueParams = {}) {
  return useQuery({
    queryKey: ["admin-review-queue", params],
    queryFn: () => getReviewQueue(params),
  })
}
