import { useQuery } from "@tanstack/react-query"
import { getPublicNoticeDetail } from "../api/notices-api"
import { publicNoticeKeys } from "../query-keys"

export function usePublicNoticeDetail(noticeId: string) {
  return useQuery({
    queryKey: publicNoticeKeys.detail(noticeId),
    queryFn: () => getPublicNoticeDetail(noticeId),
    enabled: !!noticeId,
  })
}
