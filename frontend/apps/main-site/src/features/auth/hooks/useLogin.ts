import { useMutation } from "@tanstack/react-query"
import type { LoginRequest } from "@fsm/types"
import { login } from "../api/auth-api"
import { useAuthStore } from "../store/auth-store"

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: (request: LoginRequest) => login(request),
    onSuccess: (response) => {
      setAuth(response)
    },
  })
}
