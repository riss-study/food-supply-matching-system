import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { SubmitQuoteRequest } from "@fsm/types"
import { quoteKeys } from "../../quotes/query-keys"
import { requestKeys } from "../../request-management/query-keys"
import { supplierRequestKeys } from "../../supplier-requests/query-keys"
import { submitQuote } from "../api/supplier-quotes-api"
import { supplierQuoteKeys } from "../query-keys"

export function useSubmitQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ requestId, request }: { requestId: string; request: SubmitQuoteRequest }) => submitQuote(requestId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierQuoteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: supplierRequestKeys.feeds() })
      queryClient.invalidateQueries({ queryKey: supplierRequestKeys.detail(variables.requestId) })
      queryClient.invalidateQueries({ queryKey: quoteKeys.listsByRequest(variables.requestId) })
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(variables.requestId) })
    },
  })
}
