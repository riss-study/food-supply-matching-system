import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { SubmitQuoteRequest } from "@fsm/types"
import { submitQuote } from "../api/supplier-quotes-api"

export function useSubmitQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ requestId, request }: { requestId: string; request: SubmitQuoteRequest }) => submitQuote(requestId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["supplier-quotes", "list"] })
      queryClient.invalidateQueries({ queryKey: ["supplier-requests", "feed"] })
      queryClient.invalidateQueries({ queryKey: ["supplier-request", "detail", variables.requestId] })
      queryClient.invalidateQueries({ queryKey: ["quotes", "list", variables.requestId] })
      queryClient.invalidateQueries({ queryKey: ["requests", "detail", variables.requestId] })
    },
  })
}
