import { useQuery } from "@tanstack/react-query"
import { getRequestDetail } from "../api/request-api"
import { requestKeys } from "../query-keys"

export function useRequestDetail(requestId: string) {
  return useQuery({
    queryKey: requestKeys.detail(requestId),
    queryFn: () => getRequestDetail(requestId),
    enabled: Boolean(requestId),
  })
}
