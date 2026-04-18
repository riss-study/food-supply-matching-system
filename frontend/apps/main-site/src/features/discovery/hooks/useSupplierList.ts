import { useQuery } from "@tanstack/react-query"
import { getSupplierList } from "../api/discovery-api"
import { discoveryKeys } from "../query-keys"

export function useSupplierList(params: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: discoveryKeys.supplierList(params),
    queryFn: () => getSupplierList(params),
  })
}
