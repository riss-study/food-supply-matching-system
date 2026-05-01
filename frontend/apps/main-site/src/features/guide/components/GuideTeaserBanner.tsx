import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

const STORAGE_KEY = "fsm-guide-teaser-dismissed"

/**
 * 로그인 시작 화면 상단의 "처음이세요? 이용 가이드 보기" 안내.
 *
 * 한 번 닫으면 localStorage 에 영구 저장돼 재노출 안 함. 재방문은 헤더의
 * "이용 가이드" 메뉴로 언제든 가능하므로 영구 dismiss 가 노이즈 측면에서 합리적.
 */
export function GuideTeaserBanner() {
  const { t } = useTranslation("guide")
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1"
    } catch {
      return false
    }
  })

  if (dismissed) return null

  function handleDismiss() {
    setDismissed(true)
    try {
      window.localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // localStorage 불가 환경 (privacy mode 등) 은 세션 한정 dismiss 로 fallback
    }
  }

  return (
    <div
      role="status"
      className="alert-info"
      style={{
        marginBottom: 16,
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <strong>{t("homeCta.authenticatedBannerLead")}</strong>
        <Link to="/guide" className="font-medium">
          {t("homeCta.authenticatedBannerLink")}
        </Link>
      </span>
      <button
        type="button"
        aria-label={t("homeCta.dismissAria")}
        onClick={handleDismiss}
        style={{
          border: "none",
          background: "transparent",
          color: "inherit",
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
          padding: "4px 8px",
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}
