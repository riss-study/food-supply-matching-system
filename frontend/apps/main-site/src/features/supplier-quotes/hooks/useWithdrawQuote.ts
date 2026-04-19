import { useMutation, useQueryClient } from "@tanstack/react-query"
import { quoteKeys } from "../../quotes/query-keys"
import { requestKeys } from "../../request-management/query-keys"
import { supplierRequestKeys } from "../../supplier-requests/query-keys"
import { withdrawQuote } from "../api/supplier-quotes-api"
import { supplierQuoteKeys } from "../query-keys"

interface WithdrawVariables {
  quoteId: string
  requestId: string
}

export function useWithdrawQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ quoteId }: WithdrawVariables) => withdrawQuote(quoteId),
    onSuccess: (_, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: supplierQuoteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: quoteKeys.listsByRequest(requestId) })
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(requestId) })
      queryClient.invalidateQueries({ queryKey: supplierRequestKeys.detail(requestId) })
    },
  })
}
