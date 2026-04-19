import { useMutation, useQueryClient } from "@tanstack/react-query"
import { quoteKeys } from "../../quotes/query-keys"
import { requestKeys } from "../../request-management/query-keys"
import { supplierRequestKeys } from "../../supplier-requests/query-keys"
import { withdrawQuote } from "../api/supplier-quotes-api"
import { supplierQuoteKeys } from "../query-keys"

interface WithdrawVariables {
  quoteId: string
  requestId?: string
}

export function useWithdrawQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ quoteId }: WithdrawVariables) => withdrawQuote(quoteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierQuoteKeys.lists() })
      if (variables.requestId) {
        queryClient.invalidateQueries({ queryKey: quoteKeys.listsByRequest(variables.requestId) })
        queryClient.invalidateQueries({ queryKey: requestKeys.detail(variables.requestId) })
        queryClient.invalidateQueries({ queryKey: supplierRequestKeys.detail(variables.requestId) })
      }
    },
  })
}
