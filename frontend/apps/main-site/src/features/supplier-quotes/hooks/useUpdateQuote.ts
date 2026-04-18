import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UpdateQuoteRequest } from "@fsm/types"
import { updateQuote } from "../api/supplier-quotes-api"
import { supplierQuoteKeys } from "../query-keys"

export function useUpdateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ quoteId, request }: { quoteId: string; request: UpdateQuoteRequest }) => updateQuote(quoteId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierQuoteKeys.lists() })
    },
  })
}
