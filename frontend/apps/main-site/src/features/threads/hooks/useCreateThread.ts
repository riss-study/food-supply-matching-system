import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { CreateThreadRequest, CreateThreadResponse } from "@fsm/types"
import { createThread } from "../api/thread-api"

export function useCreateThread(requestId: string) {
  const queryClient = useQueryClient()

  return useMutation<CreateThreadResponse, Error, CreateThreadRequest>({
    mutationFn: (request) => createThread(requestId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads", "list"] })
    },
  })
}
