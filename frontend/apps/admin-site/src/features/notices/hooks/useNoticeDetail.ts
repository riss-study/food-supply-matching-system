import { useQuery } from "@tanstack/react-query"
import { getNoticeDetail } from "../api/notices-api"

export function useNoticeDetail(noticeId: string) {
  return useQuery({
    queryKey: ["admin-notice-detail", noticeId],
    queryFn: () => getNoticeDetail(noticeId),
    enabled: !!noticeId,
  })
}
