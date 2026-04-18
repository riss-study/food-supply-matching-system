import { useQuery } from "@tanstack/react-query"
import { getSupplierDetail } from "../api/discovery-api"
import { discoveryKeys } from "../query-keys"

export function useSupplierDetail(profileId: string) {
  return useQuery({
    queryKey: discoveryKeys.supplierDetail(profileId),
    queryFn: () => getSupplierDetail(profileId),
    enabled: Boolean(profileId),
  })
}
