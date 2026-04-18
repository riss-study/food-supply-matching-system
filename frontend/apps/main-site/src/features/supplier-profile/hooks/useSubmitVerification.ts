import { useMutation, useQueryClient } from "@tanstack/react-query"
import { submitVerification } from "../api/supplier-profile-api"
import { supplierProfileKeys } from "../query-keys"

export function useSubmitVerification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitVerification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierProfileKeys.all })
      queryClient.invalidateQueries({ queryKey: supplierProfileKeys.latestVerification() })
    },
  })
}
