import { useMutation, useQueryClient } from "@tanstack/react-query"
import { requestKeys } from "../../request-management/query-keys"
import { supplierQuoteKeys } from "../../supplier-quotes/query-keys"
import { declineQuote } from "../api/quotes-api"
import { quoteKeys } from "../query-keys"

export function useDeclineQuote(requestId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ quoteId, reason }: { quoteId: string; reason?: string }) => declineQuote(quoteId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.listsByRequest(requestId) })
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(requestId) })
      queryClient.invalidateQueries({ queryKey: supplierQuoteKeys.lists() })
    },
  })
}
