import { useMutation } from "@tanstack/react-query"
import type { LoginRequest } from "@fsm/types"
import { login } from "../api/auth-api"
import { useAdminAuthStore } from "../store/admin-auth-store"

export function useLogin() {
  const setAuth = useAdminAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: (request: LoginRequest) => login(request),
    onSuccess: (response) => setAuth(response),
  })
}
