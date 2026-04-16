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

  const canSubmit =
    unitPriceEstimate.trim().length > 0 &&
    moq.trim().length > 0 &&
    leadTime.trim().length > 0

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
          unitPriceEstimate: unitPriceEstimate.trim(),
          moq: moq.trim(),
          leadTime: leadTime.trim(),
          sampleCost: sampleCost.trim() || undefined,
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
    <div className="page">
      <Link to={requestId ? `/supplier/requests/${requestId}` : "/supplier/requests"} className="text-muted text-sm">
        &larr; 돌아가기
      </Link>

      <div className="page-header">
        <div className="page-header-text">
          <h1>견적 제출</h1>
          <p>요청 조건을 기준으로 단가, MOQ, 납기, 샘플 비용을 정리해 제출합니다.</p>
        </div>
      </div>

      {!showConfirm ? (
        <div className="surface">
          <div className="form-stack">
            <div className="form-row">
              <div className="input-field">
                <label>예상 단가</label>
                <input className="input" type="text" value={unitPriceEstimate} onChange={(e) => setUnitPriceEstimate(e.target.value)} placeholder="예: 950원/kg, 1,200원/개" />
              </div>
              <div className="input-field">
                <label>MOQ (최소 주문량)</label>
                <input className="input" type="text" value={moq} onChange={(e) => setMoq(e.target.value)} placeholder="예: 1,000개, 500kg, 2톤" />
              </div>
            </div>
            <div className="form-row">
              <div className="input-field">
                <label>납기</label>
                <input className="input" type="text" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} placeholder="예: 30일, 3주, 2개월" />
              </div>
              <div className="input-field">
                <label>샘플 비용 (선택)</label>
                <input className="input" type="text" value={sampleCost} onChange={(e) => setSampleCost(e.target.value)} placeholder="예: 50,000원 (선택)" />
              </div>
            </div>
            <div className="input-field">
              <label>비고 (선택)</label>
              <textarea className="textarea" rows={5} value={note} onChange={(e) => setNote(e.target.value)} placeholder="추가 참고사항을 입력하세요 (선택, 최대 1,000자)" maxLength={1000} />
            </div>
            {error && <p className="text-danger text-sm">{error}</p>}
            <button className="btn btn-primary" onClick={handlePreSubmit} disabled={!canSubmit}>
              견적 제출
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="surface surface-highlight">
            <h2 className="section-title text-success">제출 내용 확인</h2>
            <p className="text-sm text-muted mb-16">
              아래 내용으로 견적을 제출합니다. 제출 후에도 submitted 상태에서는 수정하거나 철회할 수 있습니다.
            </p>
            <dl className="detail-grid">
              <dt>예상 단가</dt>
              <dd className="font-semibold">{unitPriceEstimate}</dd>

              <dt>MOQ</dt>
              <dd className="font-semibold">{moq}</dd>

              <dt>납기</dt>
              <dd className="font-semibold">{leadTime}</dd>

              {sampleCost && (
                <>
                  <dt>샘플 비용</dt>
                  <dd className="font-semibold">{sampleCost}</dd>
                </>
              )}

              {note && (
                <>
                  <dt>비고</dt>
                  <dd className="pre-wrap">{note}</dd>
                </>
              )}
            </dl>
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}

          <div className="btn-group">
            <button
              className="btn btn-primary"
              onClick={handleConfirmSubmit}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? "제출 중..." : "확인하고 제출"}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowConfirm(false)
                setError(null)
              }}
              disabled={submitMutation.isPending}
            >
              수정하기
            </button>
          </div>
        </>
      )}
    </div>
  )
}
