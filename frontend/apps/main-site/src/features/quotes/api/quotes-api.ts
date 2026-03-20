import type {
  ApiEnvelope,
  DeclineQuoteRequest,
  DeclineQuoteResponse,
  PaginationMeta,
  RequestQuoteSummary,
  SelectQuoteResponse,
} from "@fsm/types"
import { authApiClient } from "../../auth/lib/api-client"

export async function getRequestQuotes(requestId: string, params: { state?: string; page?: number; size?: number; sort?: string; order?: string }) {
  const response = await authApiClient.get<ApiEnvelope<RequestQuoteSummary[]>>(`/api/requests/${requestId}/quotes`, { params })
  return {
    items: response.data.data,
    meta: (response.data.meta as PaginationMeta | undefined) ?? {},
  }
}

export async function selectQuote(quoteId: string): Promise<SelectQuoteResponse> {
  const response = await authApiClient.post<ApiEnvelope<SelectQuoteResponse>>(`/api/quotes/${quoteId}/select`)
  return response.data.data
}

export async function declineQuote(quoteId: string, request: DeclineQuoteRequest): Promise<DeclineQuoteResponse> {
  const response = await authApiClient.post<ApiEnvelope<DeclineQuoteResponse>>(`/api/quotes/${quoteId}/decline`, request)
  return response.data.data
}
