import { useMutation, useQueryClient } from "@tanstack/react-query"
import { quoteKeys } from "../../quotes/query-keys"
import { requestKeys } from "../../request-management/query-keys"
import { supplierRequestKeys } from "../../supplier-requests/query-keys"
import { withdrawQuote } from "../api/supplier-quotes-api"
import { supplierQuoteKeys } from "../query-keys"

export function useWithdrawQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: withdrawQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierQuoteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: quoteKeys.all })
      queryClient.invalidateQueries({ queryKey: requestKeys.all })
      queryClient.invalidateQueries({ queryKey: supplierRequestKeys.feeds() })
    },
  })
}
