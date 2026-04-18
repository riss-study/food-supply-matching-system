import { useQuery } from "@tanstack/react-query"
import { getSupplierQuotes } from "../api/supplier-quotes-api"
import { supplierQuoteKeys } from "../query-keys"

export function useSupplierQuotes(params: { page?: number; size?: number }) {
  return useQuery({
    queryKey: supplierQuoteKeys.list(params),
    queryFn: () => getSupplierQuotes(params),
  })
}
