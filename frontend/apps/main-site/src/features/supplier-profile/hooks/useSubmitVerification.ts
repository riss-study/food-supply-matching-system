import { useMutation, useQueryClient } from "@tanstack/react-query"
import { submitVerification } from "../api/supplier-profile-api"

export function useSubmitVerification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitVerification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-profile"] })
      queryClient.invalidateQueries({ queryKey: ["latest-verification-submission"] })
    },
  })
}
