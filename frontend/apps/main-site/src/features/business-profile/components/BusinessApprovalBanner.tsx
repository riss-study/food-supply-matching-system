import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useMe } from "../../auth/hooks/useMe"

/**
 * Requester 의 사업자 승인 상태 배너. 대시보드에 노출.
 *
 * approved → 표시 안 함 (null 반환).
 * not_submitted / null → 등록 안내 (warning).
 * submitted → 심사 대기 안내 (info).
 * rejected → 반려 안내 (danger).
 *
 * 사용자가 `/requests/new` 진입 시 갑자기 redirect 당하는 혼란을 사전에 방지.
 */
export function BusinessApprovalBanner() {
  const { t } = useTranslation("business-profile")
  const { data: me, isLoading } = useMe()

  if (isLoading || !me || me.role !== "requester") return null

  const state = me.businessApprovalState
  if (state === "approved") return null

  if (state === "submitted") {
    return (
      <div className="alert-info" role="status" style={{ marginBottom: 16, alignItems: "flex-start" }}>
        <div>
          <p className="font-medium" style={{ margin: 0 }}>{t("dashboardBanner.submittedTitle")}</p>
          <p className="text-sm" style={{ margin: "4px 0 0", opacity: 0.85 }}>{t("dashboardBanner.submittedDesc")}</p>
          <Link to="/business-profile" className="text-sm font-medium" style={{ display: "inline-block", marginTop: 8 }}>
            {t("dashboardBanner.submittedAction")}
          </Link>
        </div>
      </div>
    )
  }

  if (state === "rejected") {
    return (
      <div className="alert-danger" role="alert" style={{ marginBottom: 16, alignItems: "flex-start" }}>
        <div>
          <p className="font-medium" style={{ margin: 0 }}>{t("dashboardBanner.rejectedTitle")}</p>
          <p className="text-sm" style={{ margin: "4px 0 0", opacity: 0.85 }}>{t("dashboardBanner.rejectedDesc")}</p>
          <Link to="/business-profile" className="text-sm font-medium" style={{ display: "inline-block", marginTop: 8 }}>
            {t("dashboardBanner.rejectedAction")}
          </Link>
        </div>
      </div>
    )
  }

  // not_submitted | null
  return (
    <div className="alert-warning" role="status" style={{ marginBottom: 16, alignItems: "flex-start" }}>
      <div>
        <p className="font-medium" style={{ margin: 0 }}>{t("dashboardBanner.notSubmittedTitle")}</p>
        <p className="text-sm" style={{ margin: "4px 0 0", opacity: 0.85 }}>{t("dashboardBanner.notSubmittedDesc")}</p>
        <Link to="/business-profile" className="text-sm font-medium" style={{ display: "inline-block", marginTop: 8 }}>
          {t("dashboardBanner.notSubmittedAction")}
        </Link>
      </div>
    </div>
  )
}
