import type { ApiEnvelope, LoginRequest, LoginResponse, MeResponse, SignupRequest, SignupResponse } from "@fsm/types"
import axios from "axios"
import { authApiClient } from "../lib/api-client"
import { useAuthStore } from "../store/auth-store"

export async function signup(request: SignupRequest): Promise<SignupResponse> {
  const response = await authApiClient.post<ApiEnvelope<SignupResponse>>("/api/auth/signup", request)
  return response.data.data
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await authApiClient.post<ApiEnvelope<LoginResponse>>("/api/auth/login", request)
  return response.data.data
}

export async function me(): Promise<MeResponse | null> {
  try {
    const response = await authApiClient.get<ApiEnvelope<MeResponse>>("/api/me")
    return response.data.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().clearAuth()
      return null
    }
    throw error
  }
}
