import { useQuery } from "@tanstack/react-query"
import { getSupplierQuotes } from "../api/supplier-quotes-api"

export function useSupplierQuotes(params: { page?: number; size?: number }) {
  return useQuery({
    queryKey: ["supplier-quotes", "list", params],
    queryFn: () => getSupplierQuotes(params),
  })
}
