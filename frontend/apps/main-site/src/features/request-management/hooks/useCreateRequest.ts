import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createRequest } from "../api/request-api"
import { requestKeys } from "../query-keys"

export function useCreateRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() })
    },
  })
}
