import type { ApiEnvelope, LoginRequest, LoginResponse } from "@fsm/types"
import { adminApiClient } from "../lib/api-client"

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await adminApiClient.post<ApiEnvelope<LoginResponse>>("/api/admin/auth/login", request)
  return response.data.data
}
