import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UpdateQuoteRequest } from "@fsm/types"
import { updateQuote } from "../api/supplier-quotes-api"

export function useUpdateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ quoteId, request }: { quoteId: string; request: UpdateQuoteRequest }) => updateQuote(quoteId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-quotes", "list"] })
    },
  })
}
