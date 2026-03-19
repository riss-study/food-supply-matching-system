import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createSupplierProfile } from "../api/supplier-profile-api"

export function useCreateSupplierProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSupplierProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-profile"] })
      queryClient.invalidateQueries({ queryKey: ["latest-verification-submission"] })
    },
  })
}
