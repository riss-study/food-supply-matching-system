import { useQuery } from "@tanstack/react-query"
import { getBusinessProfile } from "../api/business-profile-api"

export function useBusinessProfile() {
  return useQuery({
    queryKey: ["business-profile"],
    queryFn: getBusinessProfile,
  })
}
