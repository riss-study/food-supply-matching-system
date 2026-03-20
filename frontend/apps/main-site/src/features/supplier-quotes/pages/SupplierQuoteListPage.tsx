import { useMemo, useState } from "react"
import { useSupplierQuotes } from "../hooks/useSupplierQuotes"
import { useUpdateQuote } from "../hooks/useUpdateQuote"
import { useWithdrawQuote } from "../hooks/useWithdrawQuote"
import type { SupplierQuoteSummary } from "@fsm/types"

export function SupplierQuoteListPage() {
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<SupplierQuoteSummary | null>(null)
  const [unitPriceEstimate, setUnitPriceEstimate] = useState("")
  const [moq, setMoq] = useState("")
  const [leadTime, setLeadTime] = useState("")
  const [sampleCost, setSampleCost] = useState("")
  const [note, setNote] = useState("")
  const { data, isLoading, error } = useSupplierQuotes({ page, size: 20 })
  const updateMutation = useUpdateQuote()
  const withdrawMutation = useWithdrawQuote()

  const groups = useMemo(() => {
    const items = data?.items ?? []
    return {
      submitted: items.filter((item) => item.state === "submitted"),
      finished: items.filter((item) => item.state !== "submitted"),
    }
  }, [data?.items])

  const openEdit = (quote: SupplierQuoteSummary) => {
    setEditing(quote)
    setUnitPriceEstimate(String(quote.unitPriceEstimate))
    setMoq(String(quote.moq))
    setLeadTime(String(quote.leadTime))
    setSampleCost(quote.sampleCost ? String(quote.sampleCost) : "")
    setNote("")
  }

  const sections: Array<[string, SupplierQuoteSummary[]]> = [
    ["제출된 견적", groups.submitted],
    ["종료된 견적", groups.finished],
  ]

  if (isLoading) return <section><h1>내 견적</h1><p>로딩 중...</p></section>
  if (error) return <section><h1>내 견적</h1><p style={{ color: "#dc2626" }}>견적 목록을 불러오지 못했습니다.</p></section>

  return (
    <section>
      <h1>내 견적 관리</h1>
      <p style={{ color: "#6b7280" }}>submitted 상태에서만 수정/철회할 수 있습니다.</p>

      {sections.map(([title, items]) => (
        <div key={title} style={{ marginTop: "1.5rem" }}>
          <h2>{title}</h2>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {items.map((quote) => (
              <article key={quote.quoteId} style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", backgroundColor: "white" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{quote.requestTitle}</div>
                    <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>{quote.category} · {new Date(quote.submittedAt).toLocaleDateString("ko-KR")}</div>
                    <div style={{ marginTop: "0.5rem" }}>{quote.unitPriceEstimate.toLocaleString()}원 / MOQ {quote.moq.toLocaleString()} / {quote.leadTime}일</div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    <span>{quote.state}</span>
                    {quote.state === "submitted" && (
                      <>
                        <button onClick={() => openEdit(quote)}>수정</button>
                        <button onClick={() => withdrawMutation.mutate(quote.quoteId)}>철회</button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}

      {editing && (
        <div style={{ marginTop: "1.5rem", padding: "1rem", borderRadius: "0.75rem", border: "1px solid #bfdbfe", backgroundColor: "#eff6ff" }}>
          <h2 style={{ marginTop: 0 }}>견적 수정</h2>
          <div style={{ display: "grid", gap: "0.75rem", maxWidth: "640px" }}>
            <input type="number" value={unitPriceEstimate} onChange={(e) => setUnitPriceEstimate(e.target.value)} placeholder="예상 단가" />
            <input type="number" value={moq} onChange={(e) => setMoq(e.target.value)} placeholder="MOQ" />
            <input type="number" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} placeholder="납기" />
            <input type="number" value={sampleCost} onChange={(e) => setSampleCost(e.target.value)} placeholder="샘플 비용" />
            <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="비고" />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => updateMutation.mutate({ quoteId: editing.quoteId, request: { unitPriceEstimate: Number(unitPriceEstimate), moq: Number(moq), leadTime: Number(leadTime), sampleCost: sampleCost ? Number(sampleCost) : undefined, note: note || undefined } }, { onSuccess: () => setEditing(null) })}
                disabled={updateMutation.isPending}
              >
                저장
              </button>
              <button onClick={() => setEditing(null)}>취소</button>
            </div>
          </div>
        </div>
      )}

      {data?.meta?.totalPages && data.meta.totalPages > 1 && (
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
          <button disabled={!data.meta.hasPrev} onClick={() => setPage((current) => Math.max(1, current - 1))}>이전</button>
          <span>{page} / {data.meta.totalPages}</span>
          <button disabled={!data.meta.hasNext} onClick={() => setPage((current) => current + 1)}>다음</button>
        </div>
      )}
    </section>
  )
}
