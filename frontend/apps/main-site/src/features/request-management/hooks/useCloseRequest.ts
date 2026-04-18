import { useMutation, useQueryClient } from "@tanstack/react-query"
import { closeRequest } from "../api/request-api"
import { requestKeys } from "../query-keys"

export function useCloseRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: closeRequest,
    onSuccess: (_, requestId) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(requestId) })
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() })
    },
  })
}
