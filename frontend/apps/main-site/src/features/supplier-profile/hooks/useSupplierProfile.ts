import { useQuery } from "@tanstack/react-query"
import { getSupplierProfile } from "../api/supplier-profile-api"

export function useSupplierProfile() {
  return useQuery({
    queryKey: ["supplier-profile"],
    queryFn: getSupplierProfile,
  })
}
