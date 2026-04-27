import axios from "axios"

/**
 * API base URL.
 *
 * 기본값은 빈 문자열 (상대 경로) — 브라우저가 현재 페이지 origin 으로 호출 →
 * Vite dev server 의 proxy 가 backend 로 forward → same-origin → CORS 발생 안 함.
 * 외부 IP / 포트 변경 / 새 환경 추가에도 영향 0.
 *
 * 운영에서 backend 가 다른 도메인이면 `VITE_API_BASE_URL` env 로 override.
 */
export const getApiBaseUrl = (): string =>
  import.meta.env.VITE_API_BASE_URL ?? ""

export const getAdminApiBaseUrl = (): string =>
  import.meta.env.VITE_ADMIN_API_BASE_URL ?? ""

export const createApiClient = (baseURL: string, getAccessToken?: () => string | null) => {
  const client = axios.create({ baseURL })

  client.interceptors.request.use((config) => {
    const token = getAccessToken?.()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  return client
}
