import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { RequestDetail } from "@fsm/types"
import { usePublishRequest } from "../hooks/usePublishRequest"
import { useCloseRequest } from "../hooks/useCloseRequest"

interface Props {
  request: RequestDetail
  onEditToggle: () => void
  onError: (message: string) => void
}

export function RequestActionsSidebar({ request, onEditToggle, onError }: Props) {
  const { t } = useTranslation("request-management")
  const publishMutation = usePublishRequest()
  const closeMutation = useCloseRequest()

  const canEdit = request.state === "draft" || request.state === "open"
  const canPublish = request.state === "draft"
  const canClose = request.state === "open"

  const handlePublish = () => {
    if (!window.confirm(t("actions.publishConfirm"))) return
    publishMutation.mutate(request.requestId, {
      onError: () => onError(t("actions.publishError")),
    })
  }

  const handleClose = () => {
    if (!window.confirm(t("actions.closeConfirm"))) return
    closeMutation.mutate(request.requestId, {
      onError: () => onError(t("actions.closeError")),
    })
  }

  return (
    <aside className="flex flex-col gap-16">
      <div className="surface flex flex-col items-center gap-12 text-center">
        <h3 className="section-title">{t("actions.receivedQuotesTitle")}</h3>
        {(request.quoteCount ?? 0) > 0 ? (
          <>
            <p className="font-bold" style={{ fontSize: 36, color: "var(--ink)" }}>{t("actions.quoteCount", { count: request.quoteCount })}</p>
            {request.state === "open" && (
              <Link to={`/requests/${request.requestId}/quotes`} className="btn btn-primary w-full">
                {t("actions.compareQuotes")}
              </Link>
            )}
          </>
        ) : (
          <p className="text-muted text-sm">{t("actions.noQuotesYet")}</p>
        )}
      </div>

      {canPublish && (
        <button className="btn btn-primary w-full" onClick={handlePublish} disabled={publishMutation.isPending}>
          {publishMutation.isPending ? t("actions.publishing") : t("actions.publishButton")}
        </button>
      )}

      {(canEdit || canClose) && (
        <div className="flex gap-8 justify-center">
          {canEdit && (
            <button className="btn btn-secondary" onClick={onEditToggle}>
              {t("common:edit")}
            </button>
          )}
          {canClose && (
            <button className="btn btn-danger" onClick={handleClose} disabled={closeMutation.isPending}>
              {closeMutation.isPending ? t("common:processing") : t("actions.closeButton")}
            </button>
          )}
        </div>
      )}
    </aside>
  )
}
