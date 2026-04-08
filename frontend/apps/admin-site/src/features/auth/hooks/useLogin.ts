import { useMutation } from "@tanstack/react-query"
import type { LoginRequest } from "@fsm/types"
import { login } from "../api/auth-api"
import { useAdminAuthStore } from "../store/admin-auth-store"

export function useLogin() {
  const setAuth = useAdminAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: async (request: LoginRequest) => {
      const response = await login(request)
      if (response.user.role !== "admin") {
        throw new Error("관리자 계정만 로그인할 수 있습니다.")
      }
      return response
    },
    onSuccess: (response) => setAuth(response),
  })
}
