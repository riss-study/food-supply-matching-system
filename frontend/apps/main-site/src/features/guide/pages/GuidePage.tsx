import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

type StepRole = "buyer" | "supplier"

interface GuideStep {
  num: string
  title: string
  summary: string
  details: string[]
  ctaLabel: string
  ctaTo: string
}

interface GlossaryTerm {
  term: string
  desc: string
}

/**
 * 이용 가이드 페이지.
 *
 * 비로그인 / 로그인 모두 접근 가능. Buyer / Supplier 두 흐름을 탭으로 분리해
 * "어떤 순서로 무엇을 해야 하는가" 를 단계 카드로 안내한다.
 *
 * 컨텐츠는 모두 i18n (`guide.json`) 에서 가져와 다국어 / 컨텐츠 갱신 시
 * 코드 변경 없이 반영되도록 한다.
 */
export function GuidePage() {
  const { t } = useTranslation("guide")
  const [role, setRole] = useState<StepRole>("buyer")

  const glossaryTerms = t("glossary.terms", { returnObjects: true }) as GlossaryTerm[]
  const steps = t(`${role}.steps`, { returnObjects: true }) as GuideStep[]

  return (
    <div className="page guide-page" style={{ padding: "32px 0" }}>
      {/* 헤더 */}
      <header style={{ marginBottom: 32 }}>
        <h1 className="font-bold" style={{ fontSize: "1.875rem", margin: 0 }}>
          {t("header.title")}
        </h1>
        <p className="text-muted" style={{ marginTop: 8, fontSize: "1rem" }}>
          {t("header.subtitle")}
        </p>
        <p className="text-muted" style={{ marginTop: 12, fontSize: "0.95rem", lineHeight: 1.6 }}>
          {t("header.intro")}
        </p>
      </header>

      {/* 핵심 용어 사전 */}
      <section className="surface" style={{ padding: 24, marginBottom: 32 }}>
        <h2 className="font-bold mb-4" style={{ fontSize: "1.15rem" }}>
          {t("glossary.title")}
        </h2>
        <p className="text-muted text-sm mb-16">{t("glossary.subtitle")}</p>
        <ul className="guide-glossary-list">
          {glossaryTerms.map((g) => (
            <li key={g.term} className="guide-glossary-item">
              <strong className="guide-glossary-term">{g.term}</strong>
              <span className="text-sm text-muted">{g.desc}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 탭 전환 */}
      <div className="guide-tabs" role="tablist" aria-label={t("header.title")}>
        <button
          type="button"
          role="tab"
          aria-selected={role === "buyer"}
          className={`guide-tab ${role === "buyer" ? "guide-tab-active" : ""}`}
          onClick={() => setRole("buyer")}
        >
          {t("tabs.buyer")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={role === "supplier"}
          className={`guide-tab ${role === "supplier" ? "guide-tab-active" : ""}`}
          onClick={() => setRole("supplier")}
        >
          {t("tabs.supplier")}
        </button>
      </div>

      {/* 선택된 흐름 */}
      <section style={{ marginTop: 24 }}>
        <h2 className="font-bold mb-8" style={{ fontSize: "1.35rem" }}>
          {t(`${role}.title`)}
        </h2>
        <p className="text-muted mb-24" style={{ lineHeight: 1.6 }}>
          {t(`${role}.intro`)}
        </p>

        <ol className="guide-steps">
          {steps.map((step) => (
            <li key={`${role}-${step.num}`} className="surface guide-step-card">
              <div className="guide-step-num" aria-hidden="true">{step.num}</div>
              <div className="guide-step-body">
                <h3 className="font-bold guide-step-title">{step.title}</h3>
                <p className="guide-step-summary">{step.summary}</p>
                {step.details.length > 0 && (
                  <ul className="guide-step-details text-sm text-muted">
                    {step.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
                <Link to={step.ctaTo} className="btn btn-secondary guide-step-cta">
                  {step.ctaLabel}
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
