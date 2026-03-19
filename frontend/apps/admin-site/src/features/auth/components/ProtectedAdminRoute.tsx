import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAdminAuthStore } from "../store/admin-auth-store"

export function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const accessToken = useAdminAuthStore((state) => state.accessToken)
  const user = useAdminAuthStore((state) => state.user)

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
