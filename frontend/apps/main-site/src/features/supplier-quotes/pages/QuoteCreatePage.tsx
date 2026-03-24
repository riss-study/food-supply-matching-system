import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useSubmitQuote } from "../hooks/useSubmitQuote"

export function QuoteCreatePage() {
  const [searchParams] = useSearchParams()
  const requestId = searchParams.get("requestId") ?? ""
  const navigate = useNavigate()
  const submitMutation = useSubmitQuote()
  const [unitPriceEstimate, setUnitPriceEstimate] = useState("")
  const [moq, setMoq] = useState("")
  const [leadTime, setLeadTime] = useState("")
  const [sampleCost, setSampleCost] = useState("")
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const parsedUnitPriceEstimate = Number(unitPriceEstimate)
  const parsedMoq = Number(moq)
  const parsedLeadTime = Number(leadTime)
  const parsedSampleCost = sampleCost ? Number(sampleCost) : undefined
  const hasValidRequiredFields =
    Number.isInteger(parsedUnitPriceEstimate) &&
    parsedUnitPriceEstimate > 0 &&
    Number.isInteger(parsedMoq) &&
    parsedMoq > 0 &&
    Number.isInteger(parsedLeadTime) &&
    parsedLeadTime > 0
  const hasValidSampleCost =
    parsedSampleCost === undefined ||
    (Number.isInteger(parsedSampleCost) && parsedSampleCost >= 0)
  const canSubmit = hasValidRequiredFields && hasValidSampleCost

  const handlePreSubmit = () => {
    if (!requestId) {
      setError("의뢰 ID가 없습니다.")
      return
    }
    if (!canSubmit) {
      setError("필수 항목을 모두 입력해주세요.")
      return
    }
    setError(null)
    setShowConfirm(true)
  }

  const handleConfirmSubmit = () => {
    setError(null)
    submitMutation.mutate(
      {
        requestId,
        request: {
          unitPriceEstimate: parsedUnitPriceEstimate,
          moq: parsedMoq,
          leadTime: parsedLeadTime,
          sampleCost: parsedSampleCost,
          note: note || undefined,
        },
      },
      {
        onSuccess: () => navigate("/supplier/quotes"),
        onError: () => {
          setError("견적 제출에 실패했습니다.")
          setShowConfirm(false)
        },
      },
    )
  }

  return (
    <section>
      <div style={{ marginBottom: "1rem" }}>
        <Link to={requestId ? `/supplier/requests/${requestId}` : "/supplier/requests"} style={{ color: "#6b7280", textDecoration: "none" }}>← 돌아가기</Link>
      </div>
      <h1>견적 제출</h1>

      {!showConfirm ? (
        <div style={{ display: "grid", gap: "1rem", maxWidth: "640px" }}>
          <input type="number" min="1" value={unitPriceEstimate} onChange={(e) => setUnitPriceEstimate(e.target.value)} placeholder="예상 단가" />
          <input type="number" min="1" value={moq} onChange={(e) => setMoq(e.target.value)} placeholder="MOQ" />
          <input type="number" min="1" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} placeholder="납기 (일)" />
          <input type="number" min="0" value={sampleCost} onChange={(e) => setSampleCost(e.target.value)} placeholder="샘플 비용 (선택)" />
          <textarea rows={5} value={note} onChange={(e) => setNote(e.target.value)} placeholder="비고 (선택)" />
          {error && <p style={{ color: "#dc2626", margin: 0 }}>{error}</p>}
          <button onClick={handlePreSubmit} disabled={!canSubmit}>
            견적 제출
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: "640px" }}>
          <div
            style={{
              padding: "1.25rem",
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <h2 style={{ margin: "0 0 1rem", fontSize: "1.125rem", fontWeight: 600, color: "#166534" }}>
              제출 내용 확인
            </h2>
            <p style={{ margin: "0 0 1rem", color: "#166534", fontSize: "0.875rem" }}>
              아래 내용으로 견적을 제출합니다. 제출 후에도 submitted 상태에서는 수정하거나 철회할 수 있습니다.
            </p>
            <dl style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "0.75rem 1rem", margin: 0 }}>
              <dt style={{ color: "#15803d", fontSize: "0.875rem" }}>예상 단가</dt>
              <dd style={{ margin: 0, fontWeight: 600, color: "#166534" }}>
                {parsedUnitPriceEstimate.toLocaleString()}원
              </dd>

              <dt style={{ color: "#15803d", fontSize: "0.875rem" }}>MOQ</dt>
              <dd style={{ margin: 0, fontWeight: 600, color: "#166534" }}>
                {parsedMoq.toLocaleString()}개
              </dd>

              <dt style={{ color: "#15803d", fontSize: "0.875rem" }}>납기</dt>
              <dd style={{ margin: 0, fontWeight: 600, color: "#166534" }}>
                {leadTime}일
              </dd>

              {sampleCost && (
                <>
                  <dt style={{ color: "#15803d", fontSize: "0.875rem" }}>샘플 비용</dt>
                  <dd style={{ margin: 0, fontWeight: 600, color: "#166534" }}>
                    {parsedSampleCost?.toLocaleString()}원
                  </dd>
                </>
              )}

              {note && (
                <>
                  <dt style={{ color: "#15803d", fontSize: "0.875rem" }}>비고</dt>
                  <dd style={{ margin: 0, color: "#166534", whiteSpace: "pre-wrap" }}>
                    {note}
                  </dd>
                </>
              )}
            </dl>
          </div>

          {error && (
            <p style={{ color: "#dc2626", margin: "0 0 1rem" }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={handleConfirmSubmit}
              disabled={submitMutation.isPending}
              style={{
                padding: "0.625rem 1.25rem",
                backgroundColor: "#166534",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {submitMutation.isPending ? "제출 중..." : "확인하고 제출"}
            </button>
            <button
              onClick={() => {
                setShowConfirm(false)
                setError(null)
              }}
              disabled={submitMutation.isPending}
              style={{
                padding: "0.625rem 1.25rem",
                backgroundColor: "transparent",
                color: "#6b7280",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                cursor: "pointer",
              }}
            >
              수정하기
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
