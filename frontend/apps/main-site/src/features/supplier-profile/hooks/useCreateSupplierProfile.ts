import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createSupplierProfile } from "../api/supplier-profile-api"
import { supplierProfileKeys } from "../query-keys"

export function useCreateSupplierProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSupplierProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierProfileKeys.all })
      queryClient.invalidateQueries({ queryKey: supplierProfileKeys.latestVerification() })
    },
  })
}
