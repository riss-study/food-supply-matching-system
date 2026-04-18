import { useQuery } from "@tanstack/react-query"
import { getSupplierRequestFeed } from "../api/supplier-requests-api"
import { supplierRequestKeys } from "../query-keys"

export function useSupplierRequestFeed(params: { category?: string; page?: number; size?: number }) {
  return useQuery({
    queryKey: supplierRequestKeys.feed(params),
    queryFn: () => getSupplierRequestFeed(params),
  })
}
