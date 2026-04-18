import { useQuery } from "@tanstack/react-query"
import { getRequestList } from "../api/request-api"
import { requestKeys } from "../query-keys"

export function useRequestList(params: { state?: string; page?: number; size?: number }) {
  return useQuery({
    queryKey: requestKeys.list(params),
    queryFn: () => getRequestList(params),
  })
}
