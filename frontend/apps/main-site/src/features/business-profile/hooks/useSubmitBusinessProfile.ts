import { useMutation, useQueryClient } from "@tanstack/react-query"
import { authKeys } from "../../auth/query-keys"
import { submitBusinessProfile } from "../api/business-profile-api"
import { businessProfileKeys } from "../query-keys"

export function useSubmitBusinessProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitBusinessProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessProfileKeys.all })
      queryClient.invalidateQueries({ queryKey: authKeys.me() })
    },
  })
}
