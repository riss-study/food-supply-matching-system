import { useQuery } from "@tanstack/react-query"
import { getBusinessProfile } from "../api/business-profile-api"
import { businessProfileKeys } from "../query-keys"

export function useBusinessProfile() {
  return useQuery({
    queryKey: businessProfileKeys.current(),
    queryFn: getBusinessProfile,
  })
}
