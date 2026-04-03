import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSupplierQuotes } from "../hooks/useSupplierQuotes"
import { useUpdateQuote } from "../hooks/useUpdateQuote"
import { useWithdrawQuote } from "../hooks/useWithdrawQuote"
import type { SupplierQuoteSummary } from "@fsm/types"

export function SupplierQuoteListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<SupplierQuoteSummary | null>(null)
  const [unitPriceEstimate, setUnitPriceEstimate] = useState("")
  const [moq, setMoq] = useState("")
  const [leadTime, setLeadTime] = useState("")
  const [sampleCost, setSampleCost] = useState("")
  const [note, setNote] = useState("")
  const [editError, setEditError] = useState<string | null>(null)
  const { data, isLoading, error } = useSupplierQuotes({ page, size: 20 })
  const updateMutation = useUpdateQuote()
  const withdrawMutation = useWithdrawQuote()
  const parsedUnitPriceEstimate = Number(unitPriceEstimate)
  const parsedMoq = Number(moq)
  const parsedLeadTime = Number(leadTime)
  const parsedSampleCost = sampleCost ? Number(sampleCost) : undefined

  const openEdit = (quote: SupplierQuoteSummary) => {
    setEditing(quote)
    setEditError(null)
    setUnitPriceEstimate(String(quote.unitPriceEstimate))
    setMoq(String(quote.moq))
    setLeadTime(String(quote.leadTime))
    setSampleCost(quote.sampleCost ? String(quote.sampleCost) : "")
    setNote("")
  }

  const handleSave = () => {
    if (!editing) {
      return
    }

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

    if (!hasValidRequiredFields || !hasValidSampleCost) {
      setEditError("단가, MOQ, 납기는 1 이상이어야 하고 샘플 비용은 0 이상이어야 합니다.")
      return
    }

    setEditError(null)
    updateMutation.mutate(
      {
        quoteId: editing.quoteId,
        request: {
          unitPriceEstimate: parsedUnitPriceEstimate,
          moq: parsedMoq,
          leadTime: parsedLeadTime,
          sampleCost: parsedSampleCost,
          note: note || undefined,
        },
      },
      { onSuccess: () => setEditing(null) },
    )
  }

  const [stateFilter, setStateFilter] = useState<string>("")

  const stateLabels: Record<string, string> = {
    submitted: "제출됨",
    selected: "선택됨",
    declined: "거절됨",
    withdrawn: "철회됨",
  }

  const stateBadgeClass: Record<string, string> = {
    submitted: "badge badge-blue",
    selected: "badge badge-green",
    declined: "badge badge-red",
    withdrawn: "badge badge-gray",
  }

  const allItems = data?.items ?? []
  const filteredItems = stateFilter ? allItems.filter((item) => item.state === stateFilter) : allItems

  if (isLoading) return <div className="page"><div className="page-header"><h1>내 견적 관리</h1></div><p>로딩 중...</p></div>
  if (error) return <div className="page"><div className="page-header"><h1>내 견적 관리</h1></div><p className="text-danger">견적 목록을 불러오지 못했습니다.</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-text">
          <h1>내 견적 관리</h1>
        </div>
      </div>

      <div className="tab-underline">
        {[
          { value: "", label: "전체" },
          { value: "submitted", label: "제출됨" },
          { value: "selected", label: "선택됨" },
          { value: "declined", label: "거절됨" },
          { value: "withdrawn", label: "철회됨" },
        ].map((tab) => (
          <button
            key={tab.value}
            className={stateFilter === tab.value ? "active" : ""}
            onClick={() => setStateFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <p>견적이 없습니다.</p>
        </div>
      ) : (
        <div className="surface p-0 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>관련 의뢰</th>
                <th>예상 단가</th>
                <th>MOQ</th>
                <th>납기</th>
                <th>상태</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((quote) => (
                <tr key={quote.quoteId}>
                  <td className="font-semibold" data-label="관련 의뢰">{quote.requestTitle}</td>
                  <td data-label="예상 단가">{quote.unitPriceEstimate.toLocaleString()}원</td>
                  <td data-label="MOQ">{quote.moq.toLocaleString()}</td>
                  <td data-label="납기">{quote.leadTime}일</td>
                  <td data-label="상태">
                    <span className={stateBadgeClass[quote.state] ?? "badge badge-gray"}>{stateLabels[quote.state] ?? quote.state}</span>
                  </td>
                  <td data-label="액션">
                    <div className="flex gap-6">
                      {quote.state === "selected" && (
                        <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/threads/${quote.threadId}`)}>메시지</button>
                      )}
                      {quote.state === "submitted" && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(quote)}>수정</button>
                          <button className="text-danger text-sm font-medium" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => withdrawMutation.mutate(quote.quoteId)}>철회</button>
                        </>
                      )}
                      {quote.state === "declined" && <span className="text-muted text-sm">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="surface surface-highlight">
          <h2 className="section-title mb-16">견적 수정</h2>
          <div className="form-stack">
            <div className="form-row">
              <div className="input-field">
                <label>예상 단가</label>
                <input className="input" type="number" min="1" value={unitPriceEstimate} onChange={(e) => setUnitPriceEstimate(e.target.value)} placeholder="예상 단가" />
              </div>
              <div className="input-field">
                <label>MOQ</label>
                <input className="input" type="number" min="1" value={moq} onChange={(e) => setMoq(e.target.value)} placeholder="MOQ" />
              </div>
            </div>
            <div className="form-row">
              <div className="input-field">
                <label>납기</label>
                <input className="input" type="number" min="1" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} placeholder="납기" />
              </div>
              <div className="input-field">
                <label>샘플 비용</label>
                <input className="input" type="number" min="0" value={sampleCost} onChange={(e) => setSampleCost(e.target.value)} placeholder="샘플 비용" />
              </div>
            </div>
            <div className="input-field">
              <label>비고</label>
              <textarea className="textarea" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="비고" />
            </div>
            {editError && <p className="text-danger text-sm">{editError}</p>}
            <div className="btn-group">
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={updateMutation.isPending}>
                저장
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(null); setEditError(null) }}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {(data?.meta?.totalPages ?? 0) > 1 && (
        <div className="pagination">
          <button disabled={!data.meta.hasPrev} onClick={() => setPage((current) => Math.max(1, current - 1))}>이전</button>
          <span>{page} / {data.meta.totalPages}</span>
          <button disabled={!data.meta.hasNext} onClick={() => setPage((current) => current + 1)}>다음</button>
        </div>
      )}
    </div>
  )
}
