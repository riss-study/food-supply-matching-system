import { useQuery } from "@tanstack/react-query"
import { getRequestList } from "../api/request-api"

export function useRequestList(params: { state?: string; page?: number; size?: number }) {
  return useQuery({
    queryKey: ["requests", "list", params],
    queryFn: () => getRequestList(params),
  })
}
