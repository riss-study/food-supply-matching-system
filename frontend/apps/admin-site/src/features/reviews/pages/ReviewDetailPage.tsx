import { useParams } from "react-router-dom"
import { useState } from "react"
import { useReviewDetail } from "../hooks/useReviewDetail"
import { useApproveReview, useHoldReview, useRejectReview } from "../hooks/useReviewActions"
import { StateBadge } from "../components/StateBadge"
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
    <div style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <span style={{ fontWeight: 600 }}>{getActionTypeLabel(item.actionType)}</span>
        <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
          {new Date(item.createdAt).toLocaleString("ko-KR")}
        </span>
      </div>
      <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.25rem" }}>
        처리자: {item.actorUserId}
      </div>
      {item.noteInternal && (
        <div style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
          <span style={{ color: "#6b7280" }}>내부 메모:</span> {item.noteInternal}
        </div>
      )}
      {item.notePublic && (
        <div style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
          <span style={{ color: "#6b7280" }}>공개 메모:</span> {item.notePublic}
        </div>
      )}
      {item.reasonCode && (
        <div style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
          <span style={{ color: "#6b7280" }}>사유 코드:</span> {item.reasonCode}
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
    return <section><h1>검수 상세</h1><p>로딩 중...</p></section>
  }

  return (
    <section>
      <h1>검수 상세</h1>
      <div style={{ marginBottom: "1rem" }}>
        <p style={{ fontSize: "1.125rem", fontWeight: 600 }}>{data.companyName}</p>
        <p style={{ marginTop: "0.5rem" }}>
          <StateBadge state={data.state} />
        </p>
      </div>

      <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1.5rem", color: "#374151" }}>
        <p>지역: {data.region}</p>
        <p>대표자: {data.representativeName}</p>
        <p>카테고리: {data.categories.join(", ")}</p>
        <p>제출일: {new Date(data.submittedAt).toLocaleString("ko-KR")}</p>
        {data.reviewedAt && (
          <p>검수일: {new Date(data.reviewedAt).toLocaleString("ko-KR")}</p>
        )}
      </div>

      <h2 style={{ borderBottom: "2px solid #e5e7eb", paddingBottom: "0.5rem" }}>제출 파일</h2>
      <ul style={{ listStyle: "none", padding: 0, marginBottom: "1.5rem" }}>
        {data.files.map((file) => (
          <li
            key={file.fileId}
            style={{
              padding: "0.75rem",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{file.fileName} ({file.status})</span>
            {file.downloadUrl ? (
              <a
                href={file.downloadUrl}
                download
                style={{
                  padding: "0.25rem 0.75rem",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "0.25rem",
                  fontSize: "0.875rem",
                }}
              >
                다운로드
              </a>
            ) : (
              <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>다운로드 unavailable</span>
            )}
          </li>
        ))}
      </ul>

      {data.reviewHistory.length > 0 && (
        <>
          <h2 style={{ borderBottom: "2px solid #e5e7eb", paddingBottom: "0.5rem" }}>
            검수 이력 ({data.reviewHistory.length}건)
          </h2>
          <div style={{ marginBottom: "1.5rem" }}>
            {data.reviewHistory.map((item, index) => (
              <HistoryItem key={index} item={item} />
            ))}
          </div>
        </>
      )}

      <h2 style={{ borderBottom: "2px solid #e5e7eb", paddingBottom: "0.5rem" }}>검수 결정</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
        <textarea
          value={noteInternal}
          onChange={(e) => setNoteInternal(e.target.value)}
          placeholder="내부 메모"
          rows={3}
          style={{ padding: "0.5rem", borderRadius: "0.25rem", border: "1px solid #d1d5db" }}
        />
        <textarea
          value={notePublic}
          onChange={(e) => setNotePublic(e.target.value)}
          placeholder="사용자 표시 메모"
          rows={3}
          style={{ padding: "0.5rem", borderRadius: "0.25rem", border: "1px solid #d1d5db" }}
        />
        <input
          value={reasonCode}
          onChange={(e) => setReasonCode(e.target.value)}
          placeholder="사유 코드 (선택)"
          style={{ padding: "0.5rem", borderRadius: "0.25rem", border: "1px solid #d1d5db" }}
        />
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <button
          onClick={() => approveMutation.mutate({ noteInternal, notePublic })}
          disabled={approveMutation.isPending}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "0.25rem",
            cursor: approveMutation.isPending ? "not-allowed" : "pointer",
            opacity: approveMutation.isPending ? 0.6 : 1,
          }}
        >
          {approveMutation.isPending ? "처리 중..." : "승인"}
        </button>
        <button
          onClick={() => holdMutation.mutate({ noteInternal, notePublic })}
          disabled={holdMutation.isPending}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#f59e0b",
            color: "white",
            border: "none",
            borderRadius: "0.25rem",
            cursor: holdMutation.isPending ? "not-allowed" : "pointer",
            opacity: holdMutation.isPending ? 0.6 : 1,
          }}
        >
          {holdMutation.isPending ? "처리 중..." : "보류"}
        </button>
        <button
          onClick={() => rejectMutation.mutate({ noteInternal, notePublic, reasonCode })}
          disabled={rejectMutation.isPending}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "0.25rem",
            cursor: rejectMutation.isPending ? "not-allowed" : "pointer",
            opacity: rejectMutation.isPending ? 0.6 : 1,
          }}
        >
          {rejectMutation.isPending ? "처리 중..." : "반려"}
        </button>
      </div>
    </section>
  )
}
