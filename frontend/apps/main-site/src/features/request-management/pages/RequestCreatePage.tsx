import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { CreateRequestRequest, RequestMode } from "@fsm/types"
import { SUPPLIER_CATEGORY_CODES } from "@fsm/config"
import { useCreateRequest } from "../hooks/useCreateRequest"
import { useSupplierList } from "../../discovery/hooks/useSupplierList"

const certifications = [
  { code: "HACCP", label: "HACCP" },
  { code: "ISO22000", label: "ISO 22000" },
  { code: "FSSC22000", label: "FSSC 22000" },
  { code: "ORGANIC", labelKey: "organic" },
  { code: "HALAL", labelKey: "halal" },
  { code: "KOSHER", labelKey: "kosher" },
] as const

export function RequestCreatePage() {
  const { t } = useTranslation("request-management")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createMutation = useCreateRequest()

  const targetSupplierIdFromUrl = searchParams.get("targetSupplierId")
  const targetSupplierNameFromUrl = searchParams.get("targetSupplierName")
  const hasPrefilledSupplier = Boolean(targetSupplierIdFromUrl && targetSupplierNameFromUrl)

  const [mode, setMode] = useState<RequestMode>(hasPrefilledSupplier ? "targeted" : "public")
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [desiredVolume, setDesiredVolume] = useState("")
  const [targetPriceMin, setTargetPriceMin] = useState("")
  const [targetPriceMax, setTargetPriceMax] = useState("")
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([])
  const [rawMaterialRule, setRawMaterialRule] = useState<"requester_provided" | "supplier_provided" | "">("")
  const [packagingRequirement, setPackagingRequirement] = useState<"private_label" | "bulk" | "none" | "">("")
  const [deliveryRequirement, setDeliveryRequirement] = useState("")
  const [notes, setNotes] = useState("")
  const [targetSupplierIds, setTargetSupplierIds] = useState<string[]>(
    targetSupplierIdFromUrl ? [targetSupplierIdFromUrl] : []
  )
  const [supplierSearchKeyword, setSupplierSearchKeyword] = useState("")
  const [prefilledSupplierCleared, setPrefilledSupplierCleared] = useState(false)

  const { data: suppliersData } = useSupplierList({
    keyword: supplierSearchKeyword,
    page: 1,
    size: 20,
  })


  const toggleTargetSupplier = (supplierId: string) => {
    setTargetSupplierIds((prev) =>
      prev.includes(supplierId) ? prev.filter((id) => id !== supplierId) : [...prev, supplierId],
    )
  }

  const isFormValid =
    title.length >= 5 &&
    title.length <= 200 &&
    category &&
    desiredVolume.trim().length > 0 &&
    (mode === "public" || targetSupplierIds.length > 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    const requestData: CreateRequestRequest = {
      mode,
      title,
      category,
      desiredVolume: desiredVolume.trim(),
      ...(targetPriceMin || targetPriceMax
        ? {
            targetPriceRange: {
              ...(targetPriceMin ? { min: targetPriceMin } : {}),
              ...(targetPriceMax ? { max: targetPriceMax } : {}),
            },
          }
        : {}),
      ...(selectedCertifications.length > 0 ? { certificationRequirement: selectedCertifications } : {}),
      ...(rawMaterialRule ? { rawMaterialRule } : {}),
      ...(packagingRequirement ? { packagingRequirement } : {}),
      ...(deliveryRequirement ? { deliveryRequirement } : {}),
      ...(notes ? { notes } : {}),
      ...(mode === "targeted" ? { targetSupplierIds } : {}),
    }

    createMutation.mutate(requestData, {
      onSuccess: () => {
        navigate("/requests")
      },
    })
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-text">
          <h1>{t("create.title")}</h1>
          <p>{t("create.description")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-20">
        {/* 기본 정보 */}
        <section className="surface flex flex-col gap-16">
          <h2 className="section-title">{t("create.basicInfoTitle")}</h2>

          <div className="form-row">
            <div className="input-field">
              <label>{t("create.titleLabel")}</label>
              <input
                className="input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("create.titlePlaceholder")}
                minLength={5}
                maxLength={200}
                required
              />
            </div>
            <div className="input-field">
              <label>{t("create.categoryLabel")}</label>
              <select
                className="select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">{t("create.categorySelect")}</option>
                {SUPPLIER_CATEGORY_CODES.map((code) => (
                  <option key={code} value={code}>{t(`common:supplierCategory.${code}`)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="input-field">
              <label>{t("create.modeLabel")}</label>
              <select
                className="select"
                value={mode}
                onChange={(e) => setMode(e.target.value as RequestMode)}
              >
                <option value="public">{t("create.modePublic")}</option>
                <option value="targeted">{t("create.modeTargeted")}</option>
              </select>
            </div>
            <div className="input-field">
              <label>{t("create.desiredVolumeLabel")}</label>
              <input
                className="input"
                type="text"
                value={desiredVolume}
                onChange={(e) => setDesiredVolume(e.target.value)}
                placeholder={t("create.desiredVolumePlaceholder")}
                required
              />
            </div>
          </div>
        </section>

        {/* 제조 조건 */}
        <section className="surface flex flex-col gap-16">
          <h2 className="section-title">{t("create.conditionsTitle")}</h2>

          <div className="form-row">
            <div className="input-field">
              <label>{t("create.targetPriceLabel")}</label>
              <input
                className="input"
                type="text"
                value={targetPriceMin && targetPriceMax ? `${targetPriceMin} ~ ${targetPriceMax}` : targetPriceMin || targetPriceMax || ""}
                onChange={(e) => {
                  const parts = e.target.value.split("~").map((s) => s.trim())
                  setTargetPriceMin(parts[0] || "")
                  setTargetPriceMax(parts[1] || "")
                }}
                placeholder={t("create.targetPricePlaceholder")}
              />
            </div>
            <div className="input-field">
              <label>{t("create.certificationLabel")}</label>
              <select
                className="select"
                value={selectedCertifications[0] ?? ""}
                onChange={(e) => setSelectedCertifications(e.target.value ? [e.target.value] : [])}
              >
                <option value="">{t("create.certificationPlaceholder")}</option>
                {certifications.map((cert) => {
                  const label = "labelKey" in cert ? t(`create.certificationOptions.${cert.labelKey}`) : cert.label
                  return <option key={cert.code} value={cert.code}>{label}</option>
                })}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="input-field">
              <label>{t("create.rawMaterialLabel")}</label>
              <select
                className="select"
                value={rawMaterialRule}
                onChange={(e) => setRawMaterialRule(e.target.value as typeof rawMaterialRule)}
              >
                <option value="">{t("create.rawMaterialPlaceholder")}</option>
                <option value="requester_provided">{t("create.rawMaterialRequester")}</option>
                <option value="supplier_provided">{t("create.rawMaterialSupplier")}</option>
              </select>
            </div>
            <div className="input-field">
              <label>{t("create.packagingLabel")}</label>
              <select
                className="select"
                value={packagingRequirement}
                onChange={(e) => setPackagingRequirement(e.target.value as typeof packagingRequirement)}
              >
                <option value="">{t("create.packagingPlaceholder")}</option>
                <option value="private_label">{t("create.packagingPrivateLabel")}</option>
                <option value="bulk">{t("create.packagingBulk")}</option>
                <option value="none">{t("create.packagingNone")}</option>
              </select>
            </div>
          </div>

          <div className="input-field">
            <label>{t("create.deliveryLabel")}</label>
            <input
              className="input"
              type="text"
              value={deliveryRequirement}
              onChange={(e) => setDeliveryRequirement(e.target.value)}
              placeholder={t("create.deliveryPlaceholder")}
            />
          </div>

          <div className="input-field">
            <label>{t("create.notesLabel")}</label>
            <textarea
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("create.notesPlaceholder")}
              maxLength={2000}
              rows={4}
            />
          </div>
        </section>

        {/* Targeted supplier selection */}
        {mode === "targeted" && (
          <section className="surface flex flex-col gap-12">
            <h2 className="section-title">
              {t("create.targetTitle")} <span className="text-danger">{t("create.targetRequired")}</span>
              <span className="text-muted font-medium text-sm"> {t("create.targetSelectedCount", { count: targetSupplierIds.length })}</span>
            </h2>

            {hasPrefilledSupplier && targetSupplierIdFromUrl && targetSupplierIds.includes(targetSupplierIdFromUrl) && !prefilledSupplierCleared && (
              <div className="flex items-center justify-between gap-8 p-12 bg-accent-soft rounded">
                <div className="flex items-center gap-8">
                  <span className="text-success">✓</span>
                  <span className="font-semibold">{targetSupplierNameFromUrl}</span>
                  <span className="text-sm text-muted">{t("create.selected")}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    setPrefilledSupplierCleared(true)
                    toggleTargetSupplier(targetSupplierIdFromUrl)
                  }}
                >
                  {t("create.removeButton")}
                </button>
              </div>
            )}

            <div className="input-field">
              <input
                className="input"
                type="text"
                value={supplierSearchKeyword}
                onChange={(e) => setSupplierSearchKeyword(e.target.value)}
                placeholder={t("create.supplierSearchPlaceholder")}
              />
            </div>

            <div className="flex flex-col gap-8 overflow-auto">
              {suppliersData?.items.length === 0 ? (
                <p className="text-muted text-sm">{t("create.noSearchResults")}</p>
              ) : (
                suppliersData?.items.map((supplier) => (
                  <label
                    key={supplier.profileId}
                    className={`flex items-center gap-12 p-12 rounded border cursor-pointer ${
                      targetSupplierIds.includes(supplier.profileId) ? "bg-accent-soft" : "bg-paper"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={targetSupplierIds.includes(supplier.profileId)}
                      onChange={() => toggleTargetSupplier(supplier.profileId)}
                    />
                    <div>
                      <div className="font-medium">{supplier.companyName}</div>
                      <div className="text-sm text-muted">{supplier.region} · {supplier.categories.join(", ")}</div>
                    </div>
                  </label>
                ))
              )}
            </div>

            {targetSupplierIds.length === 0 && (
              <p className="text-danger text-sm">{t("create.noSuppliersSelected")}</p>
            )}
          </section>
        )}

        {createMutation.isError && (
          <div className="surface">
            <p className="text-danger">{t("create.submitError")}</p>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex gap-12">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/requests")}
          >
            {t("create.cancelButton")}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isFormValid || createMutation.isPending}
          >
            {createMutation.isPending ? t("create.submittingButton") : t("create.submitButton")}
          </button>
          {!isFormValid && (
            <p className="text-danger text-sm">
              {title.length < 5 ? t("create.validationTitleShort") : ""}
              {!category ? t("create.validationCategory") : ""}
              {desiredVolume.trim().length === 0 ? t("create.validationVolume") : ""}
              {mode === "targeted" && targetSupplierIds.length === 0 ? t("create.validationTargetSuppliers") : ""}
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
