import type { AdminStatsSummary, ApiEnvelope, GetStatsSummaryParams } from "@fsm/types"
import { adminApiClient } from "../../auth/lib/api-client"

export async function getStatsSummary(params: GetStatsSummaryParams = {}): Promise<AdminStatsSummary> {
  const response = await adminApiClient.get<ApiEnvelope<AdminStatsSummary>>("/api/admin/stats/summary", {
    params: {
      fromDate: params.fromDate,
      toDate: params.toDate,
    },
  })
  return response.data.data
}
