export type UserRole = "REQUESTER" | "SUPPLIER" | "ADMIN"

export interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
  meta?: Record<string, unknown>
}
