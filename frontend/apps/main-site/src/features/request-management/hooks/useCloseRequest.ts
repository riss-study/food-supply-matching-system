import { useMutation, useQueryClient } from "@tanstack/react-query"
import { closeRequest } from "../api/request-api"

export function useCloseRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: closeRequest,
    onSuccess: (_, requestId) => {
      queryClient.invalidateQueries({ queryKey: ["requests", "detail", requestId] })
      queryClient.invalidateQueries({ queryKey: ["requests", "list"] })
    },
  })
}
