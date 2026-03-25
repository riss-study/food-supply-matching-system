import { useQuery } from "@tanstack/react-query"
import { getPublicNoticeDetail } from "../api/notices-api"

export function usePublicNoticeDetail(noticeId: string) {
  return useQuery({
    queryKey: ["public-notice-detail", noticeId],
    queryFn: () => getPublicNoticeDetail(noticeId),
    enabled: !!noticeId,
  })
}
