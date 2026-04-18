import { Link } from "react-router-dom"
import type { RequestDetail } from "@fsm/types"
import { usePublishRequest } from "../hooks/usePublishRequest"
import { useCloseRequest } from "../hooks/useCloseRequest"

interface Props {
  request: RequestDetail
  onEditToggle: () => void
  onError: (message: string) => void
}

export function RequestActionsSidebar({ request, onEditToggle, onError }: Props) {
  const publishMutation = usePublishRequest()
  const closeMutation = useCloseRequest()

  const canEdit = request.state === "draft" || request.state === "open"
  const canPublish = request.state === "draft"
  const canClose = request.state === "open"

  const handlePublish = () => {
    if (!window.confirm("의뢰를 게시하시겠습니까? 게시 후에는 공급자가 의뢰를 볼 수 있습니다.")) return
    publishMutation.mutate(request.requestId, {
      onError: () => onError("게시 처리에 실패했습니다."),
    })
  }

  const handleClose = () => {
    if (!window.confirm("의뢰를 마감하시겠습니까? 마감 후에는 더 이상 견적을 받을 수 없습니다.")) return
    closeMutation.mutate(request.requestId, {
      onError: () => onError("마감 처리에 실패했습니다."),
    })
  }

  return (
    <aside className="flex flex-col gap-16">
      <div className="surface flex flex-col items-center gap-12" style={{ textAlign: "center" }}>
        <h3 className="section-title">받은 견적</h3>
        {(request.quoteCount ?? 0) > 0 ? (
          <>
            <p style={{ fontSize: 36, fontWeight: 700, color: "var(--ink)" }}>{request.quoteCount}건</p>
            {request.state === "open" && (
              <Link to={`/requests/${request.requestId}/quotes`} className="btn btn-primary w-full">
                견적 비교
              </Link>
            )}
          </>
        ) : (
          <p className="text-muted text-sm">아직 견적이 없습니다</p>
        )}
      </div>

      {canPublish && (
        <button className="btn btn-primary w-full" onClick={handlePublish} disabled={publishMutation.isPending}>
          {publishMutation.isPending ? "게시 중..." : "의뢰 게시하기"}
        </button>
      )}

      {(canEdit || canClose) && (
        <div className="flex gap-8 justify-center">
          {canEdit && (
            <button className="btn btn-secondary" onClick={onEditToggle}>
              수정
            </button>
          )}
          {canClose && (
            <button className="btn btn-danger" onClick={handleClose} disabled={closeMutation.isPending}>
              {closeMutation.isPending ? "처리 중..." : "마감"}
            </button>
          )}
        </div>
      )}
    </aside>
  )
}
