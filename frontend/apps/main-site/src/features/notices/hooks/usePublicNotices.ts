import { useQuery } from "@tanstack/react-query"
import { getPublicNotices, type GetPublicNoticesParams } from "../api/notices-api"
import { publicNoticeKeys } from "../query-keys"

export function usePublicNotices(params: GetPublicNoticesParams = {}) {
  return useQuery({
    queryKey: publicNoticeKeys.list({ ...params }),
    queryFn: () => getPublicNotices(params),
  })
}
