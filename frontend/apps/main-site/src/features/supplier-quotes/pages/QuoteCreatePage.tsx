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

  const handleSubmit = () => {
    if (!requestId) {
      setError("의뢰 ID가 없습니다.")
      return
    }

    setError(null)
    submitMutation.mutate(
      {
        requestId,
        request: {
          unitPriceEstimate: Number(unitPriceEstimate),
          moq: Number(moq),
          leadTime: Number(leadTime),
          sampleCost: sampleCost ? Number(sampleCost) : undefined,
          note: note || undefined,
        },
      },
      {
        onSuccess: () => navigate("/supplier/quotes"),
        onError: () => setError("견적 제출에 실패했습니다."),
      },
    )
  }

  return (
    <section>
      <div style={{ marginBottom: "1rem" }}>
        <Link to={requestId ? `/supplier/requests/${requestId}` : "/supplier/requests"} style={{ color: "#6b7280", textDecoration: "none" }}>← 돌아가기</Link>
      </div>
      <h1>견적 제출</h1>
      <div style={{ display: "grid", gap: "1rem", maxWidth: "640px" }}>
        <input type="number" value={unitPriceEstimate} onChange={(e) => setUnitPriceEstimate(e.target.value)} placeholder="예상 단가" />
        <input type="number" value={moq} onChange={(e) => setMoq(e.target.value)} placeholder="MOQ" />
        <input type="number" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} placeholder="납기 (일)" />
        <input type="number" value={sampleCost} onChange={(e) => setSampleCost(e.target.value)} placeholder="샘플 비용 (선택)" />
        <textarea rows={5} value={note} onChange={(e) => setNote(e.target.value)} placeholder="비고 (선택)" />
        {error && <p style={{ color: "#dc2626", margin: 0 }}>{error}</p>}
        <button onClick={handleSubmit} disabled={submitMutation.isPending || !unitPriceEstimate || !moq || !leadTime}>
          {submitMutation.isPending ? "제출 중..." : "견적 제출"}
        </button>
      </div>
    </section>
  )
}
