import { useQuery } from "@tanstack/react-query"
import { getSupplierRequestDetail } from "../api/supplier-requests-api"

export function useSupplierRequestDetail(requestId: string) {
  return useQuery({
    queryKey: ["supplier-requests", "detail", requestId],
    queryFn: () => getSupplierRequestDetail(requestId),
    enabled: Boolean(requestId),
  })
}
