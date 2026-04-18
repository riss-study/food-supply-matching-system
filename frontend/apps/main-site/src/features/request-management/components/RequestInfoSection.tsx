import { useTranslation } from "react-i18next"
import type { RequestDetail } from "@fsm/types"

interface Props {
  request: RequestDetail
  onCreateThread: (supplierId: string) => void
  createThreadPending: boolean
}

export function RequestInfoSection({ request, onCreateThread, createThreadPending }: Props) {
  const { t } = useTranslation("request-management")

  const formatPriceRange = (range: RequestDetail["targetPriceRange"]) => {
    if (!range) return t("common:notSpecified")
    if (range.min && range.max) return t("info.priceBetween", { min: range.min.toLocaleString(), max: range.max.toLocaleString() })
    if (range.min) return t("info.priceAbove", { min: range.min.toLocaleString() })
    if (range.max) return t("info.priceBelow", { max: range.max.toLocaleString() })
    return t("common:notSpecified")
  }

  const formatRawMaterialRule = (rule: RequestDetail["rawMaterialRule"]) => {
    return rule === "requester_provided" ? t("info.rawMaterialRequester") : t("info.rawMaterialSupplier")
  }

  const formatPackagingRequirement = (req: RequestDetail["packagingRequirement"]) => {
    if (req === "private_label") return t("info.packagingPrivateLabel")
    if (req === "bulk") return t("info.packagingBulk")
    return t("info.packagingNone")
  }

  return (
    <div className="flex flex-col gap-20">
      <div className="surface">
        <h2 className="section-title mb-12">{t("info.sectionTitle")}</h2>
        <dl className="detail-grid">
          <dt>{t("info.desiredVolume")}</dt>
          <dd>{request.desiredVolume}</dd>
          {request.targetPriceRange && (
            <>
              <dt>{t("info.targetPrice")}</dt>
              <dd>{formatPriceRange(request.targetPriceRange)}</dd>
            </>
          )}
          {request.rawMaterialRule && (
            <>
              <dt>{t("info.rawMaterialRule")}</dt>
              <dd>{formatRawMaterialRule(request.rawMaterialRule)}</dd>
            </>
          )}
          {request.packagingRequirement && (
            <>
              <dt>{t("info.packagingRequirement")}</dt>
              <dd>{formatPackagingRequirement(request.packagingRequirement)}</dd>
            </>
          )}
          {request.deliveryRequirement && (
            <>
              <dt>{t("info.deliveryRequirement")}</dt>
              <dd>{request.deliveryRequirement}</dd>
            </>
          )}
          {request.certificationRequirement?.length > 0 && (
            <>
              <dt>{t("info.certificationRequirement")}</dt>
              <dd>{request.certificationRequirement.join(", ")}</dd>
            </>
          )}
        </dl>
      </div>

      <div className="surface">
        <h2 className="section-title mb-12">{t("info.requesterTitle")}</h2>
        <dl className="flex flex-col gap-10">
          <div className="flex justify-between">
            <dt className="text-muted text-sm">{t("info.businessName")}</dt>
            <dd>{request.requester.businessName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted text-sm">{t("info.contactName")}</dt>
            <dd>{request.requester.contactName}</dd>
          </div>
        </dl>
      </div>

      {request.notes && (
        <div className="surface">
          <h2 className="section-title mb-8">{t("info.notesTitle")}</h2>
          <p className="text-muted">{request.notes}</p>
        </div>
      )}

      {request.mode === "targeted" && request.targetSuppliers.length > 0 && (
        <div className="surface">
          <h2 className="section-title mb-12">{t("info.targetSuppliersTitle")}</h2>
          <div className="flex flex-col gap-8">
            {request.targetSuppliers.map((supplier) => (
              <div
                key={supplier.supplierProfileId}
                className="flex items-center justify-between gap-8 p-12 bg-accent-soft rounded"
              >
                <span className="font-semibold text-sm">{supplier.companyName}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => onCreateThread(supplier.supplierProfileId)}
                  disabled={createThreadPending}
                >
                  {t("info.createThread")}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
