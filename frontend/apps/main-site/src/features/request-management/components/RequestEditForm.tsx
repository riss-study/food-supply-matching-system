import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { RequestDetail } from "@fsm/types"
import { useUpdateRequest } from "../hooks/useUpdateRequest"

type RawMaterialRule = "requester_provided" | "supplier_provided" | ""
type PackagingRequirement = "private_label" | "bulk" | "none" | ""

interface Props {
  request: RequestDetail
  onSaved: () => void
  onError: (message: string) => void
}

export function RequestEditForm({ request, onSaved, onError }: Props) {
  const { t } = useTranslation("request-management")
  const updateMutation = useUpdateRequest()
  const [title, setTitle] = useState(request.title)
  const [desiredVolume, setDesiredVolume] = useState(String(request.desiredVolume))
  const [targetPriceMin, setTargetPriceMin] = useState(
    request.targetPriceRange?.min ? String(request.targetPriceRange.min) : "",
  )
  const [targetPriceMax, setTargetPriceMax] = useState(
    request.targetPriceRange?.max ? String(request.targetPriceRange.max) : "",
  )
  const [rawMaterialRule, setRawMaterialRule] = useState<RawMaterialRule>(
    (request.rawMaterialRule as RawMaterialRule) ?? "",
  )
  const [packagingRequirement, setPackagingRequirement] = useState<PackagingRequirement>(
    (request.packagingRequirement as PackagingRequirement) ?? "",
  )
  const [deliveryRequirement, setDeliveryRequirement] = useState(request.deliveryRequirement ?? "")
  const [notes, setNotes] = useState(request.notes ?? "")

  const handleSubmit = () => {
    updateMutation.mutate(
      {
        requestId: request.requestId,
        request: {
          title,
          desiredVolume: desiredVolume.trim(),
          targetPriceRange:
            targetPriceMin || targetPriceMax
              ? {
                  ...(targetPriceMin ? { min: Number(targetPriceMin) } : {}),
                  ...(targetPriceMax ? { max: Number(targetPriceMax) } : {}),
                }
              : undefined,
          rawMaterialRule: rawMaterialRule || undefined,
          packagingRequirement: packagingRequirement || undefined,
          deliveryRequirement: deliveryRequirement || undefined,
          notes: notes || undefined,
        },
      },
      {
        onSuccess: onSaved,
        onError: () => onError(t("edit.saveError")),
      },
    )
  }

  return (
    <div className="surface flex flex-col gap-12">
      <h2 className="section-title">{t("edit.title")}</h2>
      <div className="input-field">
        <label>{t("edit.titleLabel")}</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("edit.titlePlaceholder")} />
      </div>
      <div className="flex gap-12 flex-wrap">
        <div className="input-field flex-1">
          <label>{t("edit.desiredVolumeLabel")}</label>
          <input
            className="input"
            type="number"
            value={desiredVolume}
            onChange={(e) => setDesiredVolume(e.target.value)}
            placeholder={t("edit.desiredVolumePlaceholder")}
          />
        </div>
        <div className="input-field flex-1">
          <label>{t("edit.priceMinLabel")}</label>
          <input
            className="input"
            type="number"
            value={targetPriceMin}
            onChange={(e) => setTargetPriceMin(e.target.value)}
            placeholder={t("edit.priceMinPlaceholder")}
          />
        </div>
        <div className="input-field flex-1">
          <label>{t("edit.priceMaxLabel")}</label>
          <input
            className="input"
            type="number"
            value={targetPriceMax}
            onChange={(e) => setTargetPriceMax(e.target.value)}
            placeholder={t("edit.priceMaxPlaceholder")}
          />
        </div>
      </div>
      <div className="flex gap-12 flex-wrap">
        <div className="input-field flex-1">
          <label>{t("edit.rawMaterialRuleLabel")}</label>
          <select
            className="select"
            value={rawMaterialRule}
            onChange={(e) => setRawMaterialRule(e.target.value as RawMaterialRule)}
          >
            <option value="">{t("edit.rawMaterialRulePlaceholder")}</option>
            <option value="requester_provided">{t("edit.rawMaterialRequester")}</option>
            <option value="supplier_provided">{t("edit.rawMaterialSupplier")}</option>
          </select>
        </div>
        <div className="input-field flex-1">
          <label>{t("edit.packagingLabel")}</label>
          <select
            className="select"
            value={packagingRequirement}
            onChange={(e) => setPackagingRequirement(e.target.value as PackagingRequirement)}
          >
            <option value="">{t("edit.packagingPlaceholder")}</option>
            <option value="private_label">{t("edit.packagingPrivateLabel")}</option>
            <option value="bulk">{t("edit.packagingBulk")}</option>
            <option value="none">{t("edit.packagingNone")}</option>
          </select>
        </div>
        <div className="input-field flex-1">
          <label>{t("edit.deliveryLabel")}</label>
          <input
            className="input"
            type="date"
            value={deliveryRequirement}
            onChange={(e) => setDeliveryRequirement(e.target.value)}
          />
        </div>
      </div>
      <div className="input-field">
        <label>{t("edit.notesLabel")}</label>
        <textarea
          className="textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("edit.notesPlaceholder")}
          rows={4}
        />
      </div>
      <div className="flex gap-8">
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSubmit}
          disabled={updateMutation.isPending || title.trim().length < 5 || desiredVolume.trim().length === 0}
        >
          {updateMutation.isPending ? t("edit.savingButton") : t("edit.saveButton")}
        </button>
      </div>
    </div>
  )
}
