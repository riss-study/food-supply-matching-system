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
