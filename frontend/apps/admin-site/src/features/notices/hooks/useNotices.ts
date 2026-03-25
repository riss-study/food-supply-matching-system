import { useQuery } from "@tanstack/react-query"
import { getNotices, type GetNoticesParams } from "../api/notices-api"

export function useNotices(params: GetNoticesParams = {}) {
  return useQuery({
    queryKey: ["admin-notices", params],
    queryFn: () => getNotices(params),
  })
}
