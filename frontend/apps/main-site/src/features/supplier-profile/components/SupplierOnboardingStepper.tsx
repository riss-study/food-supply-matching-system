import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useSupplierProfile } from "../hooks/useSupplierProfile"
import { useMe } from "../../auth/hooks/useMe"

type StepStatus = "done" | "current" | "todo"

interface OnboardingStep {
  to: string
  title: string
  desc: string
  status: StepStatus
  badge?: string
}

/**
 * Supplier 온보딩 3-step 진행 바.
 * ① 프로필 작성 → ② 검수 제출 → ③ 의뢰 받기
 *
 * approved 면 hide. 신규/대기/반려 상태일 때만 표시해 다음 행동을 명확히.
 */
export function SupplierOnboardingStepper() {
  const { t } = useTranslation("supplier-profile")
  const { data: me } = useMe()
  const { data: profile, isLoading } = useSupplierProfile()

  if (isLoading || !me || me.role !== "supplier") return null

  const verificationState = profile?.verificationState ?? null

  // approved → 모든 단계 통과. 진행 바 hide.
  if (verificationState === "approved") return null

  // approved 면 위에서 hide. 여기서는 "현재 사용자가 어느 단계에 있는가" 만 본다.
  // 검수 제출 후 admin 승인 대기 중에도 사용자는 아직 step2 단계 (수정/보강 가능) — done 으로 빠지면 모순.
  const profileDone = profile != null
  const step1Status: StepStatus = profileDone ? "done" : "current"
  const step2Status: StepStatus = profileDone ? "current" : "todo"
  const step3Status: StepStatus = "todo"

  const step2Badge =
    verificationState === "submitted" || verificationState === "under_review" || verificationState === "hold"
      ? t("onboarding.stepStatus.pending")
      : verificationState === "rejected"
      ? t("onboarding.stepStatus.rejected")
      : verificationState === "suspended"
      ? t("onboarding.stepStatus.suspended")
      : undefined

  const steps: OnboardingStep[] = [
    {
      to: "/supplier/profile",
      title: t("onboarding.step1Title"),
      desc: t("onboarding.step1Desc"),
      status: step1Status,
    },
    {
      to: "/supplier/profile",
      title: t("onboarding.step2Title"),
      desc: t("onboarding.step2Desc"),
      status: step2Status,
      badge: step2Badge,
    },
    {
      to: "/supplier/requests",
      title: t("onboarding.step3Title"),
      desc: t("onboarding.step3Desc"),
      status: step3Status,
    },
  ]

  const hint =
    verificationState === "rejected"
      ? t("onboarding.rejectedHint")
      : verificationState === "hold"
      ? t("onboarding.holdHint")
      : verificationState === "suspended"
      ? t("onboarding.suspendedHint")
      : null

  return (
    <section className="surface onboarding-stepper" style={{ padding: 24, marginBottom: 16 }}>
      <h2 className="font-bold mb-12" style={{ fontSize: "1.05rem" }}>{t("onboarding.title")}</h2>
      <ol className="onboarding-steps">
        {steps.map((step, idx) => (
          <li key={`${step.to}-${idx}`} className={`onboarding-step onboarding-step-${step.status}`}>
            <Link to={step.to} className="onboarding-step-inner">
              <div className="onboarding-step-marker" aria-hidden="true">
                {step.status === "done" ? "✓" : idx + 1}
              </div>
              <div className="onboarding-step-body">
                <div className="onboarding-step-title">
                  {step.title}
                  {step.badge && <span className="onboarding-step-badge">{step.badge}</span>}
                </div>
                <div className="onboarding-step-desc text-muted text-sm">{step.desc}</div>
              </div>
            </Link>
          </li>
        ))}
      </ol>
      {hint && (
        <p className="text-sm" style={{ marginTop: 12, color: "var(--danger, #dc2626)" }}>{hint}</p>
      )}
    </section>
  )
}
