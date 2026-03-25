import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateNotice } from "../api/notices-api"
import type { UpdateNoticeRequest } from "@fsm/types"

export function useUpdateNotice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ noticeId, request }: { noticeId: string; request: UpdateNoticeRequest }) =>
      updateNotice(noticeId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-notices"] })
      queryClient.invalidateQueries({ queryKey: ["admin-notice-detail", variables.noticeId] })
    },
  })
}
