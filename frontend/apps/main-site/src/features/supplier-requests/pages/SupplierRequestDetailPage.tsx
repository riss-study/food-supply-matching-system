import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useSupplierRequestDetail } from "../hooks/useSupplierRequestDetail"

export function SupplierRequestDetailPage() {
  const { t } = useTranslation("supplier-requests")
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  const { data: request, isLoading, error } = useSupplierRequestDetail(requestId ?? "")
  const [showQuoteConfirm, setShowQuoteConfirm] = useState(false)

  if (isLoading) {
    return (
      <div className="page">
        <h1>{t("detail.title")}</h1>
        <p>{t("detail.loading")}</p>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="page">
        <h1>{t("detail.title")}</h1>
        <p className="text-danger">{t("detail.loadError")}</p>
        <Link to="/supplier/requests" className="btn btn-ghost btn-sm">{t("detail.backLink")}</Link>
      </div>
    )
  }

  const canQuote = !request.hasQuoted && request.state === "open"

  const handleQuoteClick = () => {
    setShowQuoteConfirm(true)
  }

  const handleConfirmQuote = () => {
    navigate(`/quotes/create?requestId=${request.requestId}`)
  }

  return (
    <div className="page">
      <Link to="/supplier/requests" className="text-muted text-sm">
        {t("detail.feedBackLink")}
      </Link>

      <div className="page-header">
        <div className="flex items-center gap-12">
          <h1>{request.title}</h1>
          <span className={request.mode === "public" ? "badge badge-blue" : "badge badge-red"}>
            {request.mode === "public" ? t("detail.modePublic") : t("detail.modeTargeted")}
          </span>
        </div>
        <div className="page-header-actions">
          {request.hasQuoted ? (
            <span className="badge badge-green">{t("detail.hasQuoted")}</span>
          ) : canQuote ? (
            <button className="btn btn-primary" onClick={handleQuoteClick}>
              {t("detail.quoteCta")}
            </button>
          ) : (
            <span className="badge badge-gray">
              {request.state === "closed" ? t("detail.closedRequest") : t("detail.cannotQuote")}
            </span>
          )}
        </div>
      </div>

      {showQuoteConfirm && (
        <div className="surface surface-highlight">
          <h3 className="text-accent font-semibold mb-8">{t("detail.quoteConfirmTitle")}</h3>
          <p className="text-sm mb-12">
            {t("detail.quoteConfirmMessage")}
          </p>
          <div className="btn-group">
            <button className="btn btn-primary btn-sm" onClick={handleConfirmQuote}>
              {t("detail.quoteConfirmGo")}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowQuoteConfirm(false)}>
              {t("detail.cancelButton")}
            </button>
          </div>
        </div>
      )}

      <div className="two-col-sidebar-r-lg">
        <div className="surface">
          <h2 className="section-title mb-16">{t("detail.requestInfoTitle")}</h2>
          <dl className="detail-grid">
            <dt>{t("detail.categoryLabel")}</dt>
            <dd>{request.category}</dd>

            <dt>{t("detail.desiredVolumeLabel")}</dt>
            <dd>{request.desiredVolume}</dd>

            {request.targetPriceRange && (
              <>
                <dt>{t("detail.targetPriceLabel")}</dt>
                <dd>
                  {request.targetPriceRange.min && request.targetPriceRange.max
                    ? t("detail.priceBetween", { min: request.targetPriceRange.min.toLocaleString(), max: request.targetPriceRange.max.toLocaleString() })
                    : request.targetPriceRange.min
                      ? t("detail.priceAbove", { min: request.targetPriceRange.min.toLocaleString() })
                      : request.targetPriceRange.max
                        ? t("detail.priceBelow", { max: request.targetPriceRange.max.toLocaleString() })
                        : t("detail.priceNotSpecified")}
                </dd>
              </>
            )}

            {request.certificationRequirement && request.certificationRequirement.length > 0 && (
              <>
                <dt>{t("detail.certificationLabel")}</dt>
                <dd>
                  {request.certificationRequirement
                    .map((code) => t(`common:certification.${code}`, { defaultValue: code }))
                    .join(", ")}
                </dd>
              </>
            )}

            {request.rawMaterialRule && (
              <>
                <dt>{t("detail.rawMaterialLabel")}</dt>
                <dd>{t(`common:rawMaterialRule.${request.rawMaterialRule}`, { defaultValue: request.rawMaterialRule })}</dd>
              </>
            )}

            {request.packagingRequirement && (
              <>
                <dt>{t("detail.packagingLabel")}</dt>
                <dd>{t(`common:packagingRequirement.${request.packagingRequirement}`, { defaultValue: request.packagingRequirement })}</dd>
              </>
            )}

            {request.deliveryRequirement && (
              <>
                <dt>{t("detail.deliveryLabel")}</dt>
                <dd>{new Date(request.deliveryRequirement).toLocaleDateString("ko-KR")}</dd>
              </>
            )}

            <dt>{t("detail.createdAtLabel")}</dt>
            <dd>{new Date(request.createdAt).toLocaleDateString("ko-KR")}</dd>
          </dl>
        </div>

        <div className="surface">
          <h2 className="section-title mb-16">{t("detail.requesterInfoTitle")}</h2>
          <dl className="detail-grid">
            <dt>{t("detail.businessNameLabel")}</dt>
            <dd>{request.requesterBusinessName}</dd>

            <dt>{t("detail.contactNameLabel")}</dt>
            <dd className="text-muted">{t("detail.contactPlaceholder")}</dd>
          </dl>
        </div>
      </div>

      {request.notes && (
        <div className="surface">
          <h2 className="section-title mb-16">{t("detail.notesTitle")}</h2>
          <p className="pre-wrap">{request.notes}</p>
        </div>
      )}

      {request.mode === "targeted" && (
        <div className="surface surface-highlight">
          <h3 className="font-semibold mb-4">{t("detail.targetedBannerTitle")}</h3>
          <p className="text-sm text-muted">
            {t("detail.targetedBannerDesc")}
          </p>
        </div>
      )}
    </div>
  )
}
