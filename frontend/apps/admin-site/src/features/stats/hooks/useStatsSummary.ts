import { useQuery } from "@tanstack/react-query"
import { getStatsSummary } from "../api/stats-api"
import type { GetStatsSummaryParams } from "@fsm/types"

export function useStatsSummary(params: GetStatsSummaryParams = {}) {
  return useQuery({
    queryKey: ["admin-stats-summary", params],
    queryFn: () => getStatsSummary(params),
  })
}
