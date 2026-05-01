import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "../store/auth-store"

/**
 * 로그아웃 단일 진입점.
 *
 * - auth store 비우기 → ProtectedRoute 가 다음 렌더에서 /login 으로 redirect
 * - react-query cache 전체 비우기 → 다음 사용자 (또는 로그인 화면) 진입 시점에
 *   이전 사용자의 잔여 query 가 토큰 없이 fetch → 401 → 강제 reload 되는 race 차단
 */
export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const queryClient = useQueryClient()

  return useCallback(() => {
    clearAuth()
    queryClient.clear()
  }, [clearAuth, queryClient])
}
