import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createNotice } from "../api/notices-api"
import { adminNoticeKeys } from "../query-keys"
import type { CreateNoticeRequest } from "@fsm/types"

export function useCreateNotice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateNoticeRequest) => createNotice(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminNoticeKeys.all })
    },
  })
}
