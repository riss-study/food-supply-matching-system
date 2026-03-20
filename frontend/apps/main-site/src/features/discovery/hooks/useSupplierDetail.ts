import { useQuery } from "@tanstack/react-query"
import { getSupplierDetail } from "../api/discovery-api"

export function useSupplierDetail(profileId: string) {
  return useQuery({
    queryKey: ["supplier-detail", profileId],
    queryFn: () => getSupplierDetail(profileId),
    enabled: Boolean(profileId),
  })
}
