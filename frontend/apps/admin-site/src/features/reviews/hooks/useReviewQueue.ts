import { useQuery } from "@tanstack/react-query"
import { getReviewQueue, type GetReviewQueueParams } from "../api/review-api"
import { adminReviewKeys } from "../query-keys"

export function useReviewQueue(params: GetReviewQueueParams = {}) {
  return useQuery({
    queryKey: adminReviewKeys.queue({ ...params }),
    queryFn: () => getReviewQueue(params),
  })
}
