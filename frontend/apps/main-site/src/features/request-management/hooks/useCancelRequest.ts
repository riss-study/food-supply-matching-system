import { useMutation, useQueryClient } from "@tanstack/react-query"
import { cancelRequest } from "../api/request-api"
import { requestKeys } from "../query-keys"

export function useCancelRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) => cancelRequest(requestId, { reason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(variables.requestId) })
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() })
    },
  })
}
