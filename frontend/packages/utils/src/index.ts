import axios from "axios"

/**
 * 환경변수에서 API base URL을 가져옵니다.
 * 환경변수가 설정되지 않은 경우 개발용 기본값을 사용합니다.
 */
export const getApiBaseUrl = (): string =>
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"

export const getAdminApiBaseUrl = (): string =>
  import.meta.env.VITE_ADMIN_API_BASE_URL ?? "http://localhost:8081"

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
