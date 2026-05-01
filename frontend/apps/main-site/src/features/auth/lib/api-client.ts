import { createApiClient, getApiBaseUrl } from "@fsm/utils"
import { useAuthStore } from "../store/auth-store"

// 로그인/가입 자체는 인증 없이 동작하는 공개 endpoint.
// 이전 사용자의 stale token 이 실수로 부착되는 race 를 방지하기 위해
// 요청 시점에 Authorization 헤더를 명시적으로 제거한다.
const PUBLIC_AUTH_PATHS = ["/api/auth/login", "/api/auth/signup", "/api/auth/refresh"]

function isPublicAuthRequest(url: string | undefined): boolean {
  if (!url) return false
  return PUBLIC_AUTH_PATHS.some((p) => url.includes(p))
}

export const authApiClient = createApiClient(
  getApiBaseUrl(),
  () => useAuthStore.getState().accessToken,
)

authApiClient.interceptors.request.use((config) => {
  if (isPublicAuthRequest(config.url) && config.headers) {
    delete config.headers.Authorization
  }
  return config
})

authApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const requestUrl: string | undefined = error.config?.url

    // 401 처리 정책:
    //   1) 로그인/가입/refresh 응답의 401 은 "자격증명 실패" — 페이지 reload 금지.
    //      LoginPage 가 mutation.isError 로 메시지를 표시한다.
    //   2) 이미 /login 페이지에 있을 때도 reload 금지 (무한 루프 방지).
    //   3) 그 외에는 보호 리소스 토큰 만료/무효 → clearAuth 만. redirect 는
    //      ProtectedRoute 가 store 변화에 반응해 자동 처리하므로 axios 가
    //      window.location.href 로 강제 reload 하지 않는다 (in-flight 입력 보존).
    if (status === 401) {
      const onLoginPage = typeof window !== "undefined" && window.location.pathname === "/login"
      if (!isPublicAuthRequest(requestUrl) && !onLoginPage) {
        useAuthStore.getState().clearAuth()
      }
    }
    return Promise.reject(error)
  },
)
