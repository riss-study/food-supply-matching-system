import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { CreateSupplierProfileRequest } from "@fsm/types"
import { useSupplierCategories, useSupplierRegions } from "../../discovery/hooks/useDiscoveryLookups"

interface PortfolioImage {
  url: string
  name: string
}

interface Props {
  initialData?: Partial<CreateSupplierProfileRequest>
  onSubmit: (request: CreateSupplierProfileRequest) => void
  isPending: boolean
  contactOnly?: boolean
  existingPortfolioImages?: PortfolioImage[]
}

export function SupplierProfileForm({
  initialData,
  onSubmit,
  isPending,
  contactOnly = false,
  existingPortfolioImages = [],
}: Props) {
  const { t } = useTranslation("supplier-profile")
  const { data: availableCategories = [], isLoading: categoriesLoading } = useSupplierCategories()
  const { data: availableRegions = [], isLoading: regionsLoading } = useSupplierRegions()

  const [companyName, setCompanyName] = useState(initialData?.companyName ?? "")
  const [representativeName, setRepresentativeName] = useState(initialData?.representativeName ?? "")
  const [contactPhone, setContactPhone] = useState(initialData?.contactPhone ?? "")
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail ?? "")
  const [region, setRegion] = useState(initialData?.region ?? "")
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.categories ?? ["snack"])
  const [equipmentSummary, setEquipmentSummary] = useState(initialData?.equipmentSummary ?? "")
  const [monthlyCapacity, setMonthlyCapacity] = useState(initialData?.monthlyCapacity?.toString() ?? "50000")
  const [moq, setMoq] = useState(initialData?.moq?.toString() ?? "1000")
  const [oemAvailable, setOemAvailable] = useState(initialData?.oemAvailable ?? true)
  const [odmAvailable, setOdmAvailable] = useState(initialData?.odmAvailable ?? false)
  const [rawMaterialSupport, setRawMaterialSupport] = useState(initialData?.rawMaterialSupport ?? true)
  const [packagingLabelingSupport, setPackagingLabelingSupport] = useState(initialData?.packagingLabelingSupport ?? true)
  const [introduction, setIntroduction] = useState(initialData?.introduction ?? "")

  const [selectedPortfolioFiles, setSelectedPortfolioFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const portfolioInputRef = useRef<HTMLInputElement>(null)

  const handlePortfolioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setSelectedPortfolioFiles((prev) => [...prev, ...files])
    const newUrls = files.map((f) => URL.createObjectURL(f))
    setPreviewUrls((prev) => [...prev, ...newUrls])
    e.target.value = ""
  }

  const removeSelectedFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index])
    setSelectedPortfolioFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (contactOnly) {
      onSubmit({
        companyName: initialData?.companyName ?? "",
        representativeName: initialData?.representativeName ?? "",
        contactPhone: contactPhone || undefined,
        contactEmail: contactEmail || undefined,
        region: initialData?.region ?? "",
        categories: initialData?.categories ?? [],
        monthlyCapacity: initialData?.monthlyCapacity ?? 0,
        moq: initialData?.moq ?? 0,
        oemAvailable: initialData?.oemAvailable ?? false,
        odmAvailable: initialData?.odmAvailable ?? false,
        rawMaterialSupport: initialData?.rawMaterialSupport ?? false,
        packagingLabelingSupport: initialData?.packagingLabelingSupport ?? false,
        equipmentSummary: initialData?.equipmentSummary,
        introduction: initialData?.introduction,
      })
      return
    }

    onSubmit({
      companyName,
      representativeName,
      contactPhone: contactPhone || undefined,
      contactEmail: contactEmail || undefined,
      region,
      categories: selectedCategories,
      equipmentSummary: equipmentSummary || undefined,
      monthlyCapacity: monthlyCapacity.trim(),
      moq: moq.trim(),
      oemAvailable,
      odmAvailable,
      rawMaterialSupport,
      packagingLabelingSupport,
      introduction: introduction || undefined,
    })
  }

  if (categoriesLoading || regionsLoading) {
    return <p>{t("form.optionsLoading")}</p>
  }

  return (
    <form className="surface" onSubmit={handleSubmit}>
      <h2 className="section-title mb-16">{t("form.basicInfoTitle")}</h2>
      <div className="form-stack">
        <div className="form-row">
          <div className="input-field">
            <label>{t("form.companyNameLabel")}</label>
            <input className="input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={t("form.companyNamePlaceholder")} required disabled={contactOnly} />
          </div>
          <div className="input-field">
            <label>{t("form.representativeLabel")}</label>
            <input className="input" value={representativeName} onChange={(e) => setRepresentativeName(e.target.value)} placeholder={t("form.representativePlaceholder")} required disabled={contactOnly} />
          </div>
        </div>
        <div className="form-row">
          <div className="input-field">
            <label>{t("form.contactPhoneLabel")}</label>
            <input className="input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder={t("form.contactPhonePlaceholder")} />
          </div>
          <div className="input-field">
            <label>{t("form.contactEmailLabel")}</label>
            <input className="input" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder={t("form.contactEmailPlaceholder")} type="email" />
          </div>
        </div>

        <div className="input-field">
          <label>{t("form.regionLabel")}</label>
          <select className="select" value={region} onChange={(e) => setRegion(e.target.value)} required disabled={contactOnly}>
            <option value="">{t("form.regionSelect")}</option>
            {availableRegions.map((r) => (
              <option key={r.region} value={r.region}>
                {r.region} ({r.supplierCount})
              </option>
            ))}
          </select>
        </div>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t("form.categoryLegend")}</legend>
          <div className="chip-group">
            {availableCategories.map((c) => (
              <label
                key={c.category}
                className={`chip${selectedCategories.includes(c.category) ? " chip--active" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(c.category)}
                  onChange={() => toggleCategory(c.category)}
                  disabled={contactOnly}
                  className="sr-only"
                />
                <span>{c.category}</span>
                <span className="text-muted text-sm">({c.supplierCount})</span>
              </label>
            ))}
          </div>
          {selectedCategories.length === 0 && (
            <p className="text-danger text-sm mt-8">{t("form.categoryRequired")}</p>
          )}
        </fieldset>
      </div>

      <h2 className="section-title mt-24">{t("form.manufacturingCapabilityTitle")}</h2>
      <div className="form-stack">
        <div className="input-field">
          <label>{t("form.equipmentLabel")}</label>
          <textarea className="textarea" value={equipmentSummary} onChange={(e) => setEquipmentSummary(e.target.value)} placeholder={t("form.equipmentPlaceholder")} disabled={contactOnly} />
        </div>
        <div className="form-row">
          <div className="input-field">
            <label>{t("form.monthlyCapacityLabel")}</label>
            <input className="input" type="text" value={monthlyCapacity} onChange={(e) => setMonthlyCapacity(e.target.value)} placeholder={t("form.monthlyCapacityPlaceholder")} required disabled={contactOnly} />
          </div>
          <div className="input-field">
            <label>{t("form.moqLabel")}</label>
            <input className="input" type="text" value={moq} onChange={(e) => setMoq(e.target.value)} placeholder={t("form.moqPlaceholder")} required disabled={contactOnly} />
          </div>
        </div>

        <h2 className="section-title mt-16">{t("form.certificationTitle")}</h2>
        <div className="check-group">
          <label className="checkbox"><input type="checkbox" checked={oemAvailable} onChange={(e) => setOemAvailable(e.target.checked)} disabled={contactOnly} /> {t("form.oemLabel")}</label>
          <label className="checkbox"><input type="checkbox" checked={odmAvailable} onChange={(e) => setOdmAvailable(e.target.checked)} disabled={contactOnly} /> {t("form.odmLabel")}</label>
          <label className="checkbox"><input type="checkbox" checked={rawMaterialSupport} onChange={(e) => setRawMaterialSupport(e.target.checked)} disabled={contactOnly} /> {t("form.rawMaterialLabel")}</label>
          <label className="checkbox"><input type="checkbox" checked={packagingLabelingSupport} onChange={(e) => setPackagingLabelingSupport(e.target.checked)} disabled={contactOnly} /> {t("form.packagingLabel")}</label>
        </div>
        <div className="input-field">
          <label>{t("form.introductionLabel")}</label>
          <textarea className="textarea" value={introduction} onChange={(e) => setIntroduction(e.target.value)} placeholder={t("form.introductionPlaceholder")} disabled={contactOnly} />
        </div>

        <h2 className="section-title mt-16">{t("form.portfolioTitle")}</h2>
        <p className="text-muted text-sm">{t("form.portfolioDescription")}</p>

        {(existingPortfolioImages.length > 0 || previewUrls.length > 0) && (
          <div className="portfolio-grid">
            {existingPortfolioImages.map((img) => (
              <div key={img.url} className="portfolio-thumb">
                <img src={img.url} alt={img.name} />
                <span className="portfolio-thumb-name">{img.name}</span>
              </div>
            ))}
            {previewUrls.map((url, idx) => (
              <div key={url} className="portfolio-thumb">
                <img src={url} alt={selectedPortfolioFiles[idx]?.name ?? "preview"} />
                <span className="portfolio-thumb-name">{selectedPortfolioFiles[idx]?.name}</span>
                <button type="button" className="portfolio-thumb-remove" onClick={() => removeSelectedFile(idx)} aria-label={t("form.portfolioRemoveAria")}>&times;</button>
              </div>
            ))}
          </div>
        )}

        {existingPortfolioImages.length === 0 && previewUrls.length === 0 && (
          <p className="text-muted text-sm">{t("form.portfolioNoImages")}</p>
        )}

        <input
          ref={portfolioInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handlePortfolioSelect}
        />
        <button type="button" className="btn btn-secondary" onClick={() => portfolioInputRef.current?.click()} disabled={contactOnly}>
          {t("form.portfolioAddButton")}
        </button>

        <button className="btn btn-primary" type="submit" disabled={isPending || (!contactOnly && selectedCategories.length === 0)}>
          {isPending ? t("form.processingButton") : contactOnly ? t("form.contactSaveButton") : t("form.saveButton")}
        </button>
      </div>
    </form>
  )
}
