import { useMutation, useQueryClient } from "@tanstack/react-query"
import { requestKeys } from "../../request-management/query-keys"
import { supplierQuoteKeys } from "../../supplier-quotes/query-keys"
import { supplierRequestKeys } from "../../supplier-requests/query-keys"
import { selectQuote } from "../api/quotes-api"
import { quoteKeys } from "../query-keys"

export function useSelectQuote(requestId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: selectQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.listsByRequest(requestId) })
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(requestId) })
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() })
      queryClient.invalidateQueries({ queryKey: supplierQuoteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: supplierRequestKeys.feeds() })
    },
  })
}
