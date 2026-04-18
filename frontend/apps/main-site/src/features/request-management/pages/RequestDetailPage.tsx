import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useRequestDetail } from "../hooks/useRequestDetail"
import { useCreateThread } from "../../threads"
import { RequestStateBadge } from "../components/RequestStateBadge"
import { RequestEditForm } from "../components/RequestEditForm"
import { RequestCancelDialog } from "../components/RequestCancelDialog"
import { RequestInfoSection } from "../components/RequestInfoSection"
import { RequestActionsSidebar } from "../components/RequestActionsSidebar"

export function RequestDetailPage() {
  const { t } = useTranslation("request-management")
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  const { data: request, isLoading, error } = useRequestDetail(requestId ?? "")
  const createThreadMutation = useCreateThread(requestId ?? "")
  const [editMode, setEditMode] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="page">
        <h1>{t("detail.title")}</h1>
        <p className="text-muted">{t("common:loading")}</p>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="page">
        <h1>{t("detail.title")}</h1>
        <p className="text-danger">{t("detail.loadError")}</p>
        <Link to="/requests" className="btn btn-ghost btn-sm">
          {t("common:backToList")}
        </Link>
      </div>
    )
  }

  const handleCreateThread = (supplierId: string) => {
    if (!requestId) return
    setActionError(null)
    createThreadMutation.mutate(
      { supplierId },
      {
        onSuccess: (response) => navigate(`/threads/${response.threadId}`),
        onError: () => setActionError(t("detail.createThreadError")),
      },
    )
  }

  return (
    <div className="page">
      <Link to="/requests" className="btn btn-ghost btn-sm">
        {t("detail.backToList")}
      </Link>

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-10">
          <h1 className="text-xl font-bold">{request.title}</h1>
          <RequestStateBadge state={request.state} />
        </div>
        <div className="flex gap-12 text-muted text-sm">
          <span>{request.category}</span>
          <span>·</span>
          <span>{request.mode === "public" ? t("list.modePublic") : t("list.modeTargeted")}</span>
          <span>·</span>
          <span>{t("detail.createdSuffix", { date: new Date(request.createdAt).toLocaleDateString("ko-KR") })}</span>
        </div>
      </div>

      {editMode && (
        <RequestEditForm
          request={request}
          onSaved={() => setEditMode(false)}
          onError={setActionError}
        />
      )}

      {actionError && (
        <div className="surface" role="alert">
          <p className="text-danger">{actionError}</p>
        </div>
      )}

      {showCancelConfirm && (
        <RequestCancelDialog
          requestId={request.requestId}
          onClose={() => setShowCancelConfirm(false)}
          onError={setActionError}
        />
      )}

      <div className="two-col-sidebar-r">
        <RequestInfoSection
          request={request}
          onCreateThread={handleCreateThread}
          createThreadPending={createThreadMutation.isPending}
        />
        <RequestActionsSidebar
          request={request}
          onEditToggle={() => setEditMode((v) => !v)}
          onError={setActionError}
        />
      </div>
    </div>
  )
}
