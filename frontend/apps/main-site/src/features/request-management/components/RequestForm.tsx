import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { RequestMode, RequestDetail } from "@fsm/types"
import {
  SUPPLIER_CATEGORY_CODES,
  RAW_MATERIAL_RULES,
  PACKAGING_REQUIREMENTS,
  CERTIFICATION_CODES,
  type RawMaterialRule as RawMaterialRuleCode,
  type PackagingRequirement as PackagingRequirementCode,
} from "@fsm/config"
import { useSupplierList } from "../../discovery/hooks/useSupplierList"

/** 폼 내부 state 용 타입 — 빈 값("") 을 "미선택" 으로 허용 */
export type RawMaterialRule = RawMaterialRuleCode | ""
export type PackagingRequirement = PackagingRequirementCode | ""

export interface RequestFormValues {
  mode: RequestMode
  title: string
  category: string
  desiredVolume: string
  targetPriceMin: string
  targetPriceMax: string
  certifications: string[]
  rawMaterialRule: RawMaterialRule
  packagingRequirement: PackagingRequirement
  deliveryRequirement: string
  notes: string
  targetSupplierIds: string[]
}

export function emptyRequestValues(overrides?: Partial<RequestFormValues>): RequestFormValues {
  return {
    mode: "public",
    title: "",
    category: "",
    desiredVolume: "",
    targetPriceMin: "",
    targetPriceMax: "",
    certifications: [],
    rawMaterialRule: "",
    packagingRequirement: "",
    deliveryRequirement: "",
    notes: "",
    targetSupplierIds: [],
    ...overrides,
  }
}

export function fromRequestDetail(detail: RequestDetail): RequestFormValues {
  return {
    mode: detail.mode,
    title: detail.title,
    category: detail.category,
    desiredVolume: String(detail.desiredVolume ?? ""),
    targetPriceMin: detail.targetPriceRange?.min ? String(detail.targetPriceRange.min) : "",
    targetPriceMax: detail.targetPriceRange?.max ? String(detail.targetPriceRange.max) : "",
    certifications: detail.certificationRequirement ?? [],
    rawMaterialRule: (detail.rawMaterialRule as RawMaterialRule) ?? "",
    packagingRequirement: (detail.packagingRequirement as PackagingRequirement) ?? "",
    deliveryRequirement: detail.deliveryRequirement ?? "",
    notes: detail.notes ?? "",
    targetSupplierIds: detail.targetSuppliers?.map((s) => s.supplierProfileId) ?? [],
  }
}

interface Props {
  mode: "create" | "edit"
  initialValues: RequestFormValues
  onSubmit: (values: RequestFormValues) => void
  onCancel?: () => void
  isSubmitting: boolean
  submitError?: string | null
  prefilledSupplierName?: string | null
}

export function RequestForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitError,
  prefilledSupplierName,
}: Props) {
  const { t } = useTranslation("request-management")
  const [values, setValues] = useState<RequestFormValues>(initialValues)
  const [supplierSearchKeyword, setSupplierSearchKeyword] = useState("")
  const [prefilledSupplierCleared, setPrefilledSupplierCleared] = useState(false)

  const isCreate = mode === "create"
  const prefilledSupplierId =
    isCreate && prefilledSupplierName && initialValues.targetSupplierIds.length === 1
      ? initialValues.targetSupplierIds[0]
      : null

  const { data: suppliersData } = useSupplierList({
    keyword: supplierSearchKeyword,
    page: 1,
    size: 20,
  })

  const setField = <K extends keyof RequestFormValues>(key: K, value: RequestFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const toggleTargetSupplier = (supplierId: string) => {
    setValues((prev) => ({
      ...prev,
      targetSupplierIds: prev.targetSupplierIds.includes(supplierId)
        ? prev.targetSupplierIds.filter((id) => id !== supplierId)
        : [...prev.targetSupplierIds, supplierId],
    }))
  }

  const isFormValid =
    values.title.length >= 5 &&
    values.title.length <= 200 &&
    values.category.length > 0 &&
    values.desiredVolume.trim().length > 0 &&
    (values.mode === "public" || !isCreate || values.targetSupplierIds.length > 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return
    onSubmit(values)
  }

  return (
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
              value={values.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder={t("create.titlePlaceholder")}
              minLength={5}
              maxLength={200}
              required
            />
          </div>
          <div className="input-field">
            <label>{t("create.categoryLabel")}</label>
            {isCreate ? (
              <select
                className="select"
                value={values.category}
                onChange={(e) => setField("category", e.target.value)}
                required
              >
                <option value="">{t("create.categorySelect")}</option>
                {SUPPLIER_CATEGORY_CODES.map((code) => (
                  <option key={code} value={code}>
                    {t(`common:supplierCategory.${code}`)}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="input"
                type="text"
                value={t(`common:supplierCategory.${values.category}`, { defaultValue: values.category })}
                disabled
              />
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="input-field">
            <label>{t("create.modeLabel")}</label>
            {isCreate ? (
              <select
                className="select"
                value={values.mode}
                onChange={(e) => setField("mode", e.target.value as RequestMode)}
              >
                <option value="public">{t("create.modePublic")}</option>
                <option value="targeted">{t("create.modeTargeted")}</option>
              </select>
            ) : (
              <input
                className="input"
                type="text"
                value={values.mode === "public" ? t("create.modePublic") : t("create.modeTargeted")}
                disabled
              />
            )}
          </div>
          <div className="input-field">
            <label>{t("create.desiredVolumeLabel")}</label>
            <input
              className="input"
              type="text"
              value={values.desiredVolume}
              onChange={(e) => setField("desiredVolume", e.target.value)}
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
            <label>{t("edit.priceMinLabel")}</label>
            <input
              className="input"
              type="text"
              value={values.targetPriceMin}
              onChange={(e) => setField("targetPriceMin", e.target.value)}
              placeholder={t("edit.priceMinPlaceholder")}
            />
          </div>
          <div className="input-field">
            <label>{t("edit.priceMaxLabel")}</label>
            <input
              className="input"
              type="text"
              value={values.targetPriceMax}
              onChange={(e) => setField("targetPriceMax", e.target.value)}
              placeholder={t("edit.priceMaxPlaceholder")}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="input-field">
            <label>{t("create.certificationLabel")}</label>
            <select
              className="select"
              value={values.certifications[0] ?? ""}
              onChange={(e) =>
                setField("certifications", e.target.value ? [e.target.value] : [])
              }
            >
              <option value="">{t("create.certificationPlaceholder")}</option>
              {CERTIFICATION_CODES.map((code) => (
                <option key={code} value={code}>
                  {t(`common:certification.${code}`, { defaultValue: code })}
                </option>
              ))}
            </select>
          </div>
          <div className="input-field">
            <label>{t("create.deliveryLabel")}</label>
            <input
              className="input"
              type="text"
              value={values.deliveryRequirement}
              onChange={(e) => setField("deliveryRequirement", e.target.value)}
              placeholder={t("create.deliveryPlaceholder")}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="input-field">
            <label>{t("create.rawMaterialLabel")}</label>
            <select
              className="select"
              value={values.rawMaterialRule}
              onChange={(e) => setField("rawMaterialRule", e.target.value as RawMaterialRule)}
            >
              <option value="">{t("create.rawMaterialPlaceholder")}</option>
              {RAW_MATERIAL_RULES.map((code) => (
                <option key={code} value={code}>
                  {t(`common:rawMaterialRule.${code}`, { defaultValue: code })}
                </option>
              ))}
            </select>
          </div>
          <div className="input-field">
            <label>{t("create.packagingLabel")}</label>
            <select
              className="select"
              value={values.packagingRequirement}
              onChange={(e) => setField("packagingRequirement", e.target.value as PackagingRequirement)}
            >
              <option value="">{t("create.packagingPlaceholder")}</option>
              {PACKAGING_REQUIREMENTS.map((code) => (
                <option key={code} value={code}>
                  {t(`common:packagingRequirement.${code}`, { defaultValue: code })}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="input-field">
          <label>{t("create.notesLabel")}</label>
          <textarea
            className="textarea"
            value={values.notes}
            onChange={(e) => setField("notes", e.target.value)}
            placeholder={t("create.notesPlaceholder")}
            maxLength={2000}
            rows={4}
          />
        </div>
      </section>

      {/* 지정 공급자 선택 (create 모드에서 mode=targeted 일 때만) */}
      {isCreate && values.mode === "targeted" && (
        <section className="surface flex flex-col gap-12">
          <h2 className="section-title">
            {t("create.targetTitle")} <span className="text-danger">{t("create.targetRequired")}</span>
            <span className="text-muted font-medium text-sm">
              {" "}
              {t("create.targetSelectedCount", { count: values.targetSupplierIds.length })}
            </span>
          </h2>

          {prefilledSupplierId &&
            values.targetSupplierIds.includes(prefilledSupplierId) &&
            !prefilledSupplierCleared && (
              <div className="flex items-center justify-between gap-8 p-12 bg-accent-soft rounded">
                <div className="flex items-center gap-8">
                  <span className="text-success">✓</span>
                  <span className="font-semibold">{prefilledSupplierName}</span>
                  <span className="text-sm text-muted">{t("create.selected")}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    setPrefilledSupplierCleared(true)
                    toggleTargetSupplier(prefilledSupplierId)
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
                    values.targetSupplierIds.includes(supplier.profileId) ? "bg-accent-soft" : "bg-paper"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={values.targetSupplierIds.includes(supplier.profileId)}
                    onChange={() => toggleTargetSupplier(supplier.profileId)}
                  />
                  <div>
                    <div className="font-medium">{supplier.companyName}</div>
                    <div className="text-sm text-muted">
                      {supplier.region} · {supplier.categories.map((code) => t(`common:supplierCategory.${code}`, { defaultValue: code })).join(", ")}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>

          {values.targetSupplierIds.length === 0 && (
            <p className="text-danger text-sm">{t("create.noSuppliersSelected")}</p>
          )}
        </section>
      )}

      {/* edit 모드에서 지정 공급자 목록 read-only 표시 */}
      {!isCreate && values.mode === "targeted" && values.targetSupplierIds.length > 0 && (
        <section className="surface flex flex-col gap-8">
          <h2 className="section-title">{t("create.targetTitle")}</h2>
          <p className="text-muted text-sm">
            {t("create.targetSelectedCount", { count: values.targetSupplierIds.length })}
          </p>
        </section>
      )}

      {submitError && (
        <div className="surface">
          <p className="text-danger">{submitError}</p>
        </div>
      )}

      {/* 액션 */}
      <div className="flex gap-12">
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {t("create.cancelButton")}
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={!isFormValid || isSubmitting}>
          {isSubmitting
            ? isCreate
              ? t("create.submittingButton")
              : t("edit.savingButton")
            : isCreate
            ? t("create.submitButton")
            : t("edit.saveButton")}
        </button>
        {!isFormValid && (
          <p className="text-danger text-sm">
            {values.title.length < 5 ? t("create.validationTitleShort") : ""}
            {!values.category ? t("create.validationCategory") : ""}
            {values.desiredVolume.trim().length === 0 ? t("create.validationVolume") : ""}
            {isCreate && values.mode === "targeted" && values.targetSupplierIds.length === 0
              ? t("create.validationTargetSuppliers")
              : ""}
          </p>
        )}
      </div>
    </form>
  )
}
