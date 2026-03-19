import { createApiClient } from "@fsm/utils"
import { useAuthStore } from "../store/auth-store"

const fallbackBaseUrl = "http://localhost:8080"

export const authApiClient = createApiClient(
  import.meta.env.VITE_API_BASE_URL ?? fallbackBaseUrl,
  () => useAuthStore.getState().accessToken,
)
