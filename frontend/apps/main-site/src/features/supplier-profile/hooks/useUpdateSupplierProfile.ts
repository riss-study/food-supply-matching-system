import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateSupplierProfile } from "../api/supplier-profile-api"
import { supplierProfileKeys } from "../query-keys"

export function useUpdateSupplierProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateSupplierProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierProfileKeys.all })
    },
  })
}
