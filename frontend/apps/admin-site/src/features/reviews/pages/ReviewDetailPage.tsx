import { useParams } from "react-router-dom"
import { useState } from "react"
import { useReviewDetail } from "../hooks/useReviewDetail"
import { useApproveReview, useHoldReview, useRejectReview } from "../hooks/useReviewActions"
import { StateBadge } from "../components/StateBadge"
import { adminApiClient } from "../../auth/lib/api-client"
import type { AdminReviewHistoryItem } from "@fsm/types"

function getActionTypeLabel(actionType: string): string {
  const labels: Record<string, string> = {
    review_approve: "승인",
    review_hold: "보류",
    review_reject: "반려",
    submission_created: "제출 생성",
    submission_updated: "제출 수정",
  }
  return labels[actionType] || actionType
}

function HistoryItem({ item }: { item: AdminReviewHistoryItem }) {
  return (
    <div className="timeline-item">
      <div className="timeline-item-header">
        <span className="timeline-item-action">{getActionTypeLabel(item.actionType)}</span>
        <span className="timeline-item-date">
          {new Date(item.createdAt).toLocaleString("ko-KR")}
        </span>
      </div>
      <div className="timeline-item-actor">
        처리자: {item.actorUserId}
      </div>
      {item.noteInternal && (
        <div className="timeline-item-note">
          <span className="timeline-item-label">내부 메모:</span> {item.noteInternal}
        </div>
      )}
      {item.notePublic && (
        <div className="timeline-item-note">
          <span className="timeline-item-label">공개 메모:</span> {item.notePublic}
        </div>
      )}
      {item.reasonCode && (
        <div className="timeline-item-note">
          <span className="timeline-item-label">사유 코드:</span> {item.reasonCode}
        </div>
      )}
    </div>
  )
}

export function ReviewDetailPage() {
  const { reviewId = "" } = useParams()
  const { data, isLoading } = useReviewDetail(reviewId)
  const approveMutation = useApproveReview(reviewId)
  const holdMutation = useHoldReview(reviewId)
  const rejectMutation = useRejectReview(reviewId)
  const [noteInternal, setNoteInternal] = useState("")
  const [notePublic, setNotePublic] = useState("")
  const [reasonCode, setReasonCode] = useState("")

  if (isLoading || !data) {
    return <div className="page"><h1>검수 상세</h1><p>로딩 중...</p></div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>검수 상세</h1>
      </div>

      <div className="two-col-sidebar-r">
        <div>
          <div className="surface">
            <div className="surface-section">
              <h2 className="section-title mb-16">{data.companyName}</h2>
              <div className="surface-meta">
                <StateBadge state={data.state} />
              </div>
            </div>
            <dl className="detail-grid">
              <dt>지역</dt>
              <dd>{data.region}</dd>
              <dt>대표자</dt>
              <dd>{data.representativeName}</dd>
              <dt>카테고리</dt>
              <dd>{data.categories.join(", ")}</dd>
              <dt>제출일</dt>
              <dd>{new Date(data.submittedAt).toLocaleString("ko-KR")}</dd>
              {data.reviewedAt && (
                <>
                  <dt>검수일</dt>
                  <dd>{new Date(data.reviewedAt).toLocaleString("ko-KR")}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="surface">
            <h2 className="section-title mb-16">제출 서류</h2>
            <ul className="file-list">
              {data.files.map((file) => (
                <li key={file.fileId} className="file-list-item">
                  <span className="file-list-name">{file.fileName} ({file.status})</span>
                  {file.downloadUrl ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={async () => {
                        const res = await adminApiClient.get(file.downloadUrl, { responseType: "blob" })
                        const url = URL.createObjectURL(res.data)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = file.fileName
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                    >
                      다운로드
                    </button>
                  ) : (
                    <span className="file-list-unavailable">다운로드 불가</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          {data.reviewHistory.length > 0 && (
            <div className="surface">
              <h2 className="section-title mb-16">검수 이력 ({data.reviewHistory.length}건)</h2>
              <div className="timeline">
                {data.reviewHistory.map((item, index) => (
                  <HistoryItem key={index} item={item} />
                ))}
              </div>
            </div>
          )}

          <div className="surface">
            <h2 className="section-title mb-16">검수 결정</h2>
            <div className="form-stack">
              <div className="input-field">
                <label>내부 메모</label>
                <textarea
                  className="textarea"
                  value={noteInternal}
                  onChange={(e) => setNoteInternal(e.target.value)}
                  placeholder="내부 메모"
                  rows={3}
                />
              </div>
              <div className="input-field">
                <label>사용자 표시 메모</label>
                <textarea
                  className="textarea"
                  value={notePublic}
                  onChange={(e) => setNotePublic(e.target.value)}
                  placeholder="사용자 표시 메모"
                  rows={3}
                />
              </div>
              <div className="input-field">
                <label>사유 코드 (선택)</label>
                <input
                  className="input"
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  placeholder="사유 코드 (선택)"
                />
              </div>
              <div className="btn-group">
                <button
                  className="btn btn-primary"
                  onClick={() => approveMutation.mutate({ noteInternal, notePublic })}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? "처리 중..." : "승인"}
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => holdMutation.mutate({ noteInternal, notePublic })}
                  disabled={holdMutation.isPending}
                >
                  {holdMutation.isPending ? "처리 중..." : "보류"}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => rejectMutation.mutate({ noteInternal, notePublic, reasonCode })}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? "처리 중..." : "반려"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
