import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { LoginRequest } from "@fsm/types"
import { login } from "../api/auth-api"
import { useAuthStore } from "../store/auth-store"

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: LoginRequest) => login(request),
    onSuccess: (response) => {
      // 이전 사용자 (다른 계정 로그아웃 직후) 의 react-query cache 가
      // 새 사용자 진입 시점에 stale 한 채로 trigger 되어 401 → reload 루프를
      // 일으키는 race 가 있어, 토큰 세팅 직전에 모든 쿼리 캐시를 비운다.
      queryClient.clear()
      setAuth(response)
    },
  })
}
