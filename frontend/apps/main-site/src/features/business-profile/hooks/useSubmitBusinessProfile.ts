import { useMutation, useQueryClient } from "@tanstack/react-query"
import { submitBusinessProfile } from "../api/business-profile-api"

export function useSubmitBusinessProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitBusinessProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-profile"] })
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
    },
  })
}
