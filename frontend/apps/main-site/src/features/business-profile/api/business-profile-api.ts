import type {
  ApiEnvelope,
  BusinessProfile,
  SubmitBusinessProfileRequest,
  UpdateBusinessProfileRequest,
} from "@fsm/types"
import { authApiClient } from "../../auth/lib/api-client"

export async function getBusinessProfile(): Promise<BusinessProfile | null> {
  try {
    const response = await authApiClient.get<ApiEnvelope<BusinessProfile>>("/api/requester/business-profile")
    return response.data.data
  } catch {
    return null
  }
}

export async function submitBusinessProfile(request: SubmitBusinessProfileRequest): Promise<BusinessProfile> {
  const response = await authApiClient.post<ApiEnvelope<BusinessProfile>>("/api/requester/business-profile", request)
  return response.data.data
}

export async function updateBusinessProfile(request: UpdateBusinessProfileRequest): Promise<BusinessProfile> {
  const response = await authApiClient.patch<ApiEnvelope<BusinessProfile>>("/api/requester/business-profile", request)
  return response.data.data
}
