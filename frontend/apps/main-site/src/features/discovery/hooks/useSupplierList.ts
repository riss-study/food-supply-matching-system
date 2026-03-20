import { useQuery } from "@tanstack/react-query"
import { getSupplierList } from "../api/discovery-api"

export function useSupplierList(params: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: ["supplier-discovery", params],
    queryFn: () => getSupplierList(params),
  })
}
