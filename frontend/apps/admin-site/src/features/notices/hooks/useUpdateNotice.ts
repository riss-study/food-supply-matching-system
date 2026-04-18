import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateNotice } from "../api/notices-api"
import { adminNoticeKeys } from "../query-keys"
import type { UpdateNoticeRequest } from "@fsm/types"

export function useUpdateNotice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ noticeId, request }: { noticeId: string; request: UpdateNoticeRequest }) =>
      updateNotice(noticeId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminNoticeKeys.all })
      queryClient.invalidateQueries({ queryKey: adminNoticeKeys.detail(variables.noticeId) })
    },
  })
}
