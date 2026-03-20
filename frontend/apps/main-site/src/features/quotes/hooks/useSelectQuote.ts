import { useMutation, useQueryClient } from "@tanstack/react-query"
import { selectQuote } from "../api/quotes-api"

export function useSelectQuote(requestId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: selectQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes", "list", requestId] })
      queryClient.invalidateQueries({ queryKey: ["requests", "detail", requestId] })
      queryClient.invalidateQueries({ queryKey: ["requests", "list"] })
      queryClient.invalidateQueries({ queryKey: ["supplier-quotes", "list"] })
      queryClient.invalidateQueries({ queryKey: ["supplier-requests", "feed"] })
    },
  })
}
