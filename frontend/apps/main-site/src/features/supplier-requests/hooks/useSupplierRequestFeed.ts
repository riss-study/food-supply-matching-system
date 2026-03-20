import { useQuery } from "@tanstack/react-query"
import { getSupplierRequestFeed } from "../api/supplier-requests-api"

export function useSupplierRequestFeed(params: { category?: string; page?: number; size?: number }) {
  return useQuery({
    queryKey: ["supplier-requests", "feed", params],
    queryFn: () => getSupplierRequestFeed(params),
  })
}
