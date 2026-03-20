import type {
  ApiEnvelope,
  PaginationMeta,
  SubmitQuoteRequest,
  SubmitQuoteResponse,
  SupplierQuoteSummary,
  UpdateQuoteRequest,
  UpdateQuoteResponse,
  WithdrawQuoteResponse,
} from "@fsm/types"
import { authApiClient } from "../../auth/lib/api-client"

export async function submitQuote(requestId: string, request: SubmitQuoteRequest): Promise<SubmitQuoteResponse> {
  const response = await authApiClient.post<ApiEnvelope<SubmitQuoteResponse>>(`/api/requests/${requestId}/quotes`, request)
  return response.data.data
}

export async function updateQuote(quoteId: string, request: UpdateQuoteRequest): Promise<UpdateQuoteResponse> {
  const response = await authApiClient.patch<ApiEnvelope<UpdateQuoteResponse>>(`/api/quotes/${quoteId}`, request)
  return response.data.data
}

export async function withdrawQuote(quoteId: string): Promise<WithdrawQuoteResponse> {
  const response = await authApiClient.post<ApiEnvelope<WithdrawQuoteResponse>>(`/api/quotes/${quoteId}/withdraw`)
  return response.data.data
}

export async function getSupplierQuotes(params: { page?: number; size?: number }) {
  const response = await authApiClient.get<ApiEnvelope<SupplierQuoteSummary[]>>(`/api/supplier/quotes`, { params })
  return {
    items: response.data.data,
    meta: (response.data.meta as PaginationMeta | undefined) ?? {},
  }
}
