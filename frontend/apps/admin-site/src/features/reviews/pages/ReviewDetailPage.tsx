import { useParams } from "react-router-dom"
import { useState } from "react"
import { useReviewDetail } from "../hooks/useReviewDetail"
import { useApproveReview, useHoldReview, useRejectReview } from "../hooks/useReviewActions"

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
      <p>{data.companyName} / {data.state}</p>
      <p>지역: {data.region}</p>
      <p>카테고리: {data.categories.join(", ")}</p>

      <h2>제출 파일</h2>
      <ul>
        {data.files.map((file) => <li key={file.fileId}>{file.fileName} ({file.status})</li>)}
      </ul>

      <h2>검수 메모</h2>
      <textarea value={noteInternal} onChange={(e) => setNoteInternal(e.target.value)} placeholder="내부 메모" />
      <textarea value={notePublic} onChange={(e) => setNotePublic(e.target.value)} placeholder="사용자 표시 메모" />
      <input value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} placeholder="사유 코드 (선택)" />

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <button onClick={() => approveMutation.mutate({ noteInternal, notePublic })}>승인</button>
        <button onClick={() => holdMutation.mutate({ noteInternal, notePublic })}>보류</button>
        <button onClick={() => rejectMutation.mutate({ noteInternal, notePublic, reasonCode })}>반려</button>
      </div>
    </section>
  )
}
