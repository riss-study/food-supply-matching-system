import { useMutation, useQueryClient } from "@tanstack/react-query"
import { declineQuote } from "../api/quotes-api"

export function useDeclineQuote(requestId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ quoteId, reason }: { quoteId: string; reason?: string }) => declineQuote(quoteId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes", "list", requestId] })
      queryClient.invalidateQueries({ queryKey: ["requests", "detail", requestId] })
      queryClient.invalidateQueries({ queryKey: ["supplier-quotes", "list"] })
    },
  })
}
