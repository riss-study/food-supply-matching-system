import { useQuery } from "@tanstack/react-query"
import { getNoticeDetail } from "../api/notices-api"
import { adminNoticeKeys } from "../query-keys"

export function useNoticeDetail(noticeId: string) {
  return useQuery({
    queryKey: adminNoticeKeys.detail(noticeId),
    queryFn: () => getNoticeDetail(noticeId),
    enabled: !!noticeId,
  })
}
