import { useMutation, useQueryClient } from "@tanstack/react-query"
import { withdrawQuote } from "../api/supplier-quotes-api"

export function useWithdrawQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: withdrawQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-quotes", "list"] })
      queryClient.invalidateQueries({ queryKey: ["quotes"] })
      queryClient.invalidateQueries({ queryKey: ["requests"] })
      queryClient.invalidateQueries({ queryKey: ["supplier-requests", "feed"] })
    },
  })
}
