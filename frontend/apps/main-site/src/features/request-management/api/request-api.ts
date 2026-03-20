import type {
  ApiEnvelope,
  CancelRequestRequest,
  CancelRequestResponse,
  CloseRequestResponse,
  CreateRequestRequest,
  CreateRequestResponse,
  PaginationMeta,
  PublishRequestResponse,
  RequestDetail,
  RequestSummary,
  UpdateRequestRequest,
  UpdateRequestResponse,
} from "@fsm/types"
import { authApiClient } from "../../auth/lib/api-client"

export async function getRequestList(params: { state?: string; page?: number; size?: number }) {
  const response = await authApiClient.get<ApiEnvelope<RequestSummary[]>>("/api/requests", { params })
  return {
    items: response.data.data,
    meta: (response.data.meta as PaginationMeta | undefined) ?? {},
  }
}

export async function getRequestDetail(requestId: string): Promise<RequestDetail> {
  const response = await authApiClient.get<ApiEnvelope<RequestDetail>>(`/api/requests/${requestId}`)
  return response.data.data
}

export async function createRequest(request: CreateRequestRequest): Promise<CreateRequestResponse> {
  const response = await authApiClient.post<ApiEnvelope<CreateRequestResponse>>("/api/requests", request)
  return response.data.data
}

export async function updateRequest(
  requestId: string,
  request: UpdateRequestRequest,
): Promise<UpdateRequestResponse> {
  const response = await authApiClient.patch<ApiEnvelope<UpdateRequestResponse>>(`/api/requests/${requestId}`, request)
  return response.data.data
}

export async function publishRequest(requestId: string): Promise<PublishRequestResponse> {
  const response = await authApiClient.post<ApiEnvelope<PublishRequestResponse>>(`/api/requests/${requestId}/publish`)
  return response.data.data
}

export async function closeRequest(requestId: string): Promise<CloseRequestResponse> {
  const response = await authApiClient.post<ApiEnvelope<CloseRequestResponse>>(`/api/requests/${requestId}/close`)
  return response.data.data
}

export async function cancelRequest(
  requestId: string,
  request: CancelRequestRequest,
): Promise<CancelRequestResponse> {
  const response = await authApiClient.post<ApiEnvelope<CancelRequestResponse>>(
    `/api/requests/${requestId}/cancel`,
    request,
  )
  return response.data.data
}
