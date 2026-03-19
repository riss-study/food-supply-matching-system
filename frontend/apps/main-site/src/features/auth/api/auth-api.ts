import type { ApiEnvelope, LoginRequest, LoginResponse, MeResponse, SignupRequest, SignupResponse } from "@fsm/types"
import { authApiClient } from "../lib/api-client"

export async function signup(request: SignupRequest): Promise<SignupResponse> {
  const response = await authApiClient.post<ApiEnvelope<SignupResponse>>("/api/auth/signup", request)
  return response.data.data
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await authApiClient.post<ApiEnvelope<LoginResponse>>("/api/auth/login", request)
  return response.data.data
}

export async function me(): Promise<MeResponse> {
  const response = await authApiClient.get<ApiEnvelope<MeResponse>>("/api/me")
  return response.data.data
}
