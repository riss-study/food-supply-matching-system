import { useQuery } from "@tanstack/react-query"
import { getRequestQuotes } from "../api/quotes-api"
import { quoteKeys } from "../query-keys"

export function useRequestQuotes(
  requestId: string,
  params: { state?: string; page?: number; size?: number; sort?: string; order?: string },
) {
  return useQuery({
    queryKey: quoteKeys.list(requestId, params),
    queryFn: () => getRequestQuotes(requestId, params),
    enabled: Boolean(requestId),
  })
}
