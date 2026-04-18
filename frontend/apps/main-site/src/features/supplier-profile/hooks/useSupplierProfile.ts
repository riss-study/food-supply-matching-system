import { useQuery } from "@tanstack/react-query"
import { getSupplierProfile } from "../api/supplier-profile-api"
import { supplierProfileKeys } from "../query-keys"

export function useSupplierProfile() {
  return useQuery({
    queryKey: supplierProfileKeys.current(),
    queryFn: getSupplierProfile,
  })
}
