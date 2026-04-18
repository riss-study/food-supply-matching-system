import { useState } from "react"
import { useCancelRequest } from "../hooks/useCancelRequest"

interface Props {
  requestId: string
  onClose: () => void
  onError: (message: string) => void
}

export function RequestCancelDialog({ requestId, onClose, onError }: Props) {
  const cancelMutation = useCancelRequest()
  const [reason, setReason] = useState("")

  const handleConfirm = () => {
    if (!reason.trim()) return
    cancelMutation.mutate(
      { requestId, reason },
      {
        onSuccess: onClose,
        onError: () => onError("취소 처리에 실패했습니다."),
      },
    )
  }

  return (
    <div className="surface flex flex-col gap-12">
      <h3 className="font-semibold text-danger">의뢰 취소</h3>
      <p className="text-muted">의뢰를 취소하시겠습니까? 취소된 의뢰는 복구할 수 없습니다.</p>
      <div className="input-field">
        <label>취소 사유 (선택사항)</label>
        <textarea
          className="textarea"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="취소 사유를 입력해주세요"
          maxLength={500}
          rows={2}
        />
      </div>
      <div className="flex gap-8">
        <button className="btn btn-danger btn-sm" onClick={handleConfirm} disabled={cancelMutation.isPending}>
          {cancelMutation.isPending ? "처리 중..." : "확인"}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>
          취소
        </button>
      </div>
    </div>
  )
}
