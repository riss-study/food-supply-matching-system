import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateRequest } from "../api/request-api"

export function useUpdateRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ requestId, request }: { requestId: string; request: Parameters<typeof updateRequest>[1] }) =>
      updateRequest(requestId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requests", "detail", variables.requestId] })
      queryClient.invalidateQueries({ queryKey: ["requests", "list"] })
    },
  })
}
