import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useSubmitQuote } from "../hooks/useSubmitQuote"

export function QuoteCreatePage() {
  const { t } = useTranslation("supplier-quotes")
  const [searchParams] = useSearchParams()
  const requestId = searchParams.get("requestId") ?? ""
  const navigate = useNavigate()
  const submitMutation = useSubmitQuote()
  const [unitPriceEstimate, setUnitPriceEstimate] = useState("")
  const [moq, setMoq] = useState("")
  const [leadTime, setLeadTime] = useState("")
  const [sampleCost, setSampleCost] = useState("")
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const canSubmit =
    unitPriceEstimate.trim().length > 0 &&
    moq.trim().length > 0 &&
    leadTime.trim().length > 0

  const handlePreSubmit = () => {
    if (!requestId) {
      setError(t("create.missingRequestId"))
      return
    }
    if (!canSubmit) {
      setError(t("create.missingRequiredFields"))
      return
    }
    setError(null)
    setShowConfirm(true)
  }

  const handleConfirmSubmit = () => {
    setError(null)
    submitMutation.mutate(
      {
        requestId,
        request: {
          unitPriceEstimate: unitPriceEstimate.trim(),
          moq: moq.trim(),
          leadTime: leadTime.trim(),
          sampleCost: sampleCost.trim() || undefined,
          note: note || undefined,
        },
      },
      {
        onSuccess: () => navigate("/supplier/quotes"),
        onError: () => {
          setError(t("create.submitError"))
          setShowConfirm(false)
        },
      },
    )
  }

  return (
    <div className="page">
      <Link to={requestId ? `/supplier/requests/${requestId}` : "/supplier/requests"} className="text-muted text-sm">
        {t("create.backLink")}
      </Link>

      <div className="page-header">
        <div className="page-header-text">
          <h1>{t("create.title")}</h1>
          <p>{t("create.description")}</p>
        </div>
      </div>

      {!showConfirm ? (
        <div className="surface">
          <div className="form-stack">
            <div className="form-row">
              <div className="input-field">
                <label>{t("create.unitPriceLabel")}</label>
                <input className="input" type="text" value={unitPriceEstimate} onChange={(e) => setUnitPriceEstimate(e.target.value)} placeholder={t("create.unitPricePlaceholder")} />
              </div>
              <div className="input-field">
                <label>{t("create.moqLabel")}</label>
                <input className="input" type="text" value={moq} onChange={(e) => setMoq(e.target.value)} placeholder={t("create.moqPlaceholder")} />
              </div>
            </div>
            <div className="form-row">
              <div className="input-field">
                <label>{t("create.leadTimeLabel")}</label>
                <input className="input" type="text" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} placeholder={t("create.leadTimePlaceholder")} />
              </div>
              <div className="input-field">
                <label>{t("create.sampleCostLabel")}</label>
                <input className="input" type="text" value={sampleCost} onChange={(e) => setSampleCost(e.target.value)} placeholder={t("create.sampleCostPlaceholder")} />
              </div>
            </div>
            <div className="input-field">
              <label>{t("create.noteLabel")}</label>
              <textarea className="textarea" rows={5} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("create.notePlaceholder")} maxLength={1000} />
            </div>
            {error && <p className="text-danger text-sm">{error}</p>}
            <button className="btn btn-primary" onClick={handlePreSubmit} disabled={!canSubmit}>
              {t("create.submitButton")}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="surface surface-highlight">
            <h2 className="section-title text-success">{t("create.confirmTitle")}</h2>
            <p className="text-sm text-muted mb-16">
              {t("create.confirmDescription")}
            </p>
            <dl className="detail-grid">
              <dt>{t("create.confirmUnitPrice")}</dt>
              <dd className="font-semibold">{unitPriceEstimate}</dd>

              <dt>{t("create.confirmMoq")}</dt>
              <dd className="font-semibold">{moq}</dd>

              <dt>{t("create.confirmLeadTime")}</dt>
              <dd className="font-semibold">{leadTime}</dd>

              {sampleCost && (
                <>
                  <dt>{t("create.confirmSampleCost")}</dt>
                  <dd className="font-semibold">{sampleCost}</dd>
                </>
              )}

              {note && (
                <>
                  <dt>{t("create.confirmNote")}</dt>
                  <dd className="pre-wrap">{note}</dd>
                </>
              )}
            </dl>
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}

          <div className="btn-group">
            <button
              className="btn btn-primary"
              onClick={handleConfirmSubmit}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? t("create.finalSubmitting") : t("create.finalSubmitButton")}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowConfirm(false)
                setError(null)
              }}
              disabled={submitMutation.isPending}
            >
              {t("create.editButton")}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
