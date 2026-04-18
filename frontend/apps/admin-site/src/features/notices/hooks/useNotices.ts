import { useQuery } from "@tanstack/react-query"
import { getNotices, type GetNoticesParams } from "../api/notices-api"
import { adminNoticeKeys } from "../query-keys"

export function useNotices(params: GetNoticesParams = {}) {
  return useQuery({
    queryKey: adminNoticeKeys.list({ ...params }),
    queryFn: () => getNotices(params),
  })
}
