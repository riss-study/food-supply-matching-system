import { useMutation, useQueryClient } from "@tanstack/react-query"
import { publishRequest } from "../api/request-api"

export function usePublishRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: publishRequest,
    onSuccess: (_, requestId) => {
      queryClient.invalidateQueries({ queryKey: ["requests", "detail", requestId] })
      queryClient.invalidateQueries({ queryKey: ["requests", "list"] })
      queryClient.invalidateQueries({ queryKey: ["supplier-requests", "feed"] })
    },
  })
}
