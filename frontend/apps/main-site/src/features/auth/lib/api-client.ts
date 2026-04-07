import { createApiClient, getApiBaseUrl } from "@fsm/utils"
import { useAuthStore } from "../store/auth-store"

export const authApiClient = createApiClient(
  getApiBaseUrl(),
  () => useAuthStore.getState().accessToken,
)

authApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth()
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)
