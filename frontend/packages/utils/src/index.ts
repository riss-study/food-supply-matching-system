import axios from "axios"

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
