import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useRequestDetail } from "../hooks/useRequestDetail"
import { useCreateThread } from "../../threads"
import { RequestStateBadge } from "../components/RequestStateBadge"
import { RequestEditForm } from "../components/RequestEditForm"
import { RequestCancelDialog } from "../components/RequestCancelDialog"
import { RequestInfoSection } from "../components/RequestInfoSection"
import { RequestActionsSidebar } from "../components/RequestActionsSidebar"

export function RequestDetailPage() {
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
        <h1>의뢰 상세</h1>
        <p className="text-muted">로딩 중...</p>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="page">
        <h1>의뢰 상세</h1>
        <p className="text-danger">의뢰 정보를 불러올 수 없습니다.</p>
        <Link to="/requests" className="btn btn-ghost btn-sm">
          목록으로 돌아가기
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
        onError: () => setActionError("대화방 생성에 실패했습니다."),
      },
    )
  }

  return (
    <div className="page">
      <Link to="/requests" className="btn btn-ghost btn-sm">
        ← 목록으로 돌아가기
      </Link>

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-10">
          <h1 className="text-xl font-bold">{request.title}</h1>
          <RequestStateBadge state={request.state} />
        </div>
        <div className="flex gap-12 text-muted text-sm">
          <span>{request.category}</span>
          <span>·</span>
          <span>{request.mode === "public" ? "공개" : "지정"}</span>
          <span>·</span>
          <span>{new Date(request.createdAt).toLocaleDateString("ko-KR")} 등록</span>
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
