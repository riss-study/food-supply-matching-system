import { createApiClient } from "@fsm/utils"
import { useAdminAuthStore } from "../store/admin-auth-store"

export const adminAuthApiClient = createApiClient(
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
  () => useAdminAuthStore.getState().accessToken,
)

export const adminApiClient = createApiClient(
  import.meta.env.VITE_ADMIN_API_BASE_URL ?? "http://localhost:8081",
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
