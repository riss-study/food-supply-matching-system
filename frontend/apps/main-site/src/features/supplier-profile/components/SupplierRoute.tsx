import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useMe } from "../../auth/hooks/useMe"
import { useAuthStore } from "../../auth/store/auth-store"

interface SupplierRouteProps {
  children: ReactNode
}

export function SupplierRoute({ children }: SupplierRouteProps) {
  const { t } = useTranslation("supplier-profile")
  const accessToken = useAuthStore((state) => state.accessToken)
  const { data: me, isLoading } = useMe()
  const location = useLocation()

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (isLoading) {
    return <div>{t("common:loading")}</div>
  }

  if (me?.role !== "supplier") {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
