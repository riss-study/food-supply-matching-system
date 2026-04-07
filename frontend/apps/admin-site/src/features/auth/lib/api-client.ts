import { createApiClient, getApiBaseUrl, getAdminApiBaseUrl } from "@fsm/utils"
import { useAdminAuthStore } from "../store/admin-auth-store"

export const adminAuthApiClient = createApiClient(
  getApiBaseUrl(),
  () => useAdminAuthStore.getState().accessToken,
)

export const adminApiClient = createApiClient(
  getAdminApiBaseUrl(),
  () => useAdminAuthStore.getState().accessToken,
)

// 401 응답 시 자동 로그아웃
adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAdminAuthStore.getState().clearAuth()
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)
