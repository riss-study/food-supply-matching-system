import { useQuery } from "@tanstack/react-query"
import { getReviewQueue } from "../api/review-api"

export function useReviewQueue(state?: string) {
  return useQuery({
    queryKey: ["admin-review-queue", state],
    queryFn: () => getReviewQueue(state),
  })
}
