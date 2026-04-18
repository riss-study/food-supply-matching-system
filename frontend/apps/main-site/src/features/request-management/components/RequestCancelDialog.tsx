import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useCancelRequest } from "../hooks/useCancelRequest"

interface Props {
  requestId: string
  onClose: () => void
  onError: (message: string) => void
}

export function RequestCancelDialog({ requestId, onClose, onError }: Props) {
  const { t } = useTranslation("request-management")
  const cancelMutation = useCancelRequest()
  const [reason, setReason] = useState("")

  const handleConfirm = () => {
    if (!reason.trim()) return
    cancelMutation.mutate(
      { requestId, reason },
      {
        onSuccess: onClose,
        onError: () => onError(t("cancel.cancelError")),
      },
    )
  }

  return (
    <div className="surface flex flex-col gap-12">
      <h3 className="font-semibold text-danger">{t("cancel.title")}</h3>
      <p className="text-muted">{t("cancel.message")}</p>
      <div className="input-field">
        <label>{t("cancel.reasonLabel")}</label>
        <textarea
          className="textarea"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("cancel.reasonPlaceholder")}
          maxLength={500}
          rows={2}
        />
      </div>
      <div className="flex gap-8">
        <button className="btn btn-danger btn-sm" onClick={handleConfirm} disabled={cancelMutation.isPending}>
          {cancelMutation.isPending ? t("cancel.processingButton") : t("cancel.confirmButton")}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>
          {t("cancel.cancelButton")}
        </button>
      </div>
    </div>
  )
}
