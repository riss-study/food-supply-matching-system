import { useQuery } from "@tanstack/react-query"
import { getStatsSummary } from "../api/stats-api"
import { adminStatsKeys } from "../query-keys"
import type { GetStatsSummaryParams } from "@fsm/types"

export function useStatsSummary(params: GetStatsSummaryParams = {}) {
  return useQuery({
    queryKey: adminStatsKeys.summary({ ...params }),
    queryFn: () => getStatsSummary(params),
  })
}
