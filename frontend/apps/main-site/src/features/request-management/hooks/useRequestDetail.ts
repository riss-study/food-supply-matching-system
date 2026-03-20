import { useQuery } from "@tanstack/react-query"
import { getRequestDetail } from "../api/request-api"

export function useRequestDetail(requestId: string) {
  return useQuery({
    queryKey: ["requests", "detail", requestId],
    queryFn: () => getRequestDetail(requestId),
    enabled: Boolean(requestId),
  })
}
