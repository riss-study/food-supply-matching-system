import { useQuery } from "@tanstack/react-query"
import { getPublicNotices, type GetPublicNoticesParams } from "../api/notices-api"

export function usePublicNotices(params: GetPublicNoticesParams = {}) {
  return useQuery({
    queryKey: ["public-notices", params],
    queryFn: () => getPublicNotices(params),
  })
}
