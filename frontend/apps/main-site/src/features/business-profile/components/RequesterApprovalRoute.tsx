import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useMe } from "../../auth/hooks/useMe"
import { useAuthStore } from "../../auth/store/auth-store"

interface RequesterApprovalRouteProps {
  children: ReactNode
}

export function RequesterApprovalRoute({ children }: RequesterApprovalRouteProps) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const { data: me, isLoading } = useMe()
  const location = useLocation()

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (isLoading) {
    return <div>로딩 중...</div>
  }

  if (me?.businessApprovalState !== "approved") {
    return <Navigate to="/business-profile" replace />
  }

  return <>{children}</>
}
