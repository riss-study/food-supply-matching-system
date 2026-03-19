import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateBusinessProfile } from "../api/business-profile-api"

export function useUpdateBusinessProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateBusinessProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-profile"] })
    },
  })
}
