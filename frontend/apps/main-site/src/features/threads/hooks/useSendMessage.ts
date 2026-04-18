import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { SendThreadMessageRequest, SendThreadMessageResponse } from "@fsm/types"
import { sendMessage } from "../api/thread-api"
import { threadKeys } from "../query-keys"

export function useSendMessage(threadId: string) {
  const queryClient = useQueryClient()

  return useMutation<SendThreadMessageResponse, Error, SendThreadMessageRequest>({
    mutationFn: (request) => sendMessage(threadId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: threadKeys.detail(threadId) })
      queryClient.invalidateQueries({ queryKey: threadKeys.lists() })
    },
  })
}
