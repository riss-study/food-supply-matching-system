import { useQuery } from "@tanstack/react-query"
import { getSupplierRequestDetail } from "../api/supplier-requests-api"
import { supplierRequestKeys } from "../query-keys"

export function useSupplierRequestDetail(requestId: string) {
  return useQuery({
    queryKey: supplierRequestKeys.detail(requestId),
    queryFn: () => getSupplierRequestDetail(requestId),
    enabled: Boolean(requestId),
  })
}
