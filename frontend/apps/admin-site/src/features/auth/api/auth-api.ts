import type { ApiEnvelope, LoginRequest, LoginResponse } from "@fsm/types"
import { adminAuthApiClient } from "../lib/api-client"

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await adminAuthApiClient.post<ApiEnvelope<LoginResponse>>("/api/auth/login", request)
  return response.data.data
}
