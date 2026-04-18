import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useMe } from "../../auth/hooks/useMe"

interface ApprovalGateProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ApprovalGate({ children, fallback }: ApprovalGateProps) {
  const { t } = useTranslation("business-profile")
  const { data: me, isLoading } = useMe()

  if (isLoading) {
    return <span>{t("common:loading")}</span>
  }

  const isApproved = me?.businessApprovalState === "approved"

  if (!isApproved) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="alert-warning">
        <div>
          <p className="font-medium" style={{ margin: 0 }}>{t("approvalGate.title")}</p>
          <p className="text-base" style={{ margin: "8px 0 0" }}>
            {t("approvalGate.description")}
          </p>
          <Link
            to="/business-profile"
            className="btn btn-sm btn-warning mt-12"
          >
            {t("approvalGate.link")}
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
