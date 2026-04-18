import { useState } from "react"
import type { RequestDetail } from "@fsm/types"
import { useUpdateRequest } from "../hooks/useUpdateRequest"

type RawMaterialRule = "requester_provided" | "supplier_provided" | ""
type PackagingRequirement = "private_label" | "bulk" | "none" | ""

interface Props {
  request: RequestDetail
  onSaved: () => void
  onError: (message: string) => void
}

export function RequestEditForm({ request, onSaved, onError }: Props) {
  const updateMutation = useUpdateRequest()
  const [title, setTitle] = useState(request.title)
  const [desiredVolume, setDesiredVolume] = useState(String(request.desiredVolume))
  const [targetPriceMin, setTargetPriceMin] = useState(
    request.targetPriceRange?.min ? String(request.targetPriceRange.min) : "",
  )
  const [targetPriceMax, setTargetPriceMax] = useState(
    request.targetPriceRange?.max ? String(request.targetPriceRange.max) : "",
  )
  const [rawMaterialRule, setRawMaterialRule] = useState<RawMaterialRule>(
    (request.rawMaterialRule as RawMaterialRule) ?? "",
  )
  const [packagingRequirement, setPackagingRequirement] = useState<PackagingRequirement>(
    (request.packagingRequirement as PackagingRequirement) ?? "",
  )
  const [deliveryRequirement, setDeliveryRequirement] = useState(request.deliveryRequirement ?? "")
  const [notes, setNotes] = useState(request.notes ?? "")

  const handleSubmit = () => {
    updateMutation.mutate(
      {
        requestId: request.requestId,
        request: {
          title,
          desiredVolume: desiredVolume.trim(),
          targetPriceRange:
            targetPriceMin || targetPriceMax
              ? {
                  ...(targetPriceMin ? { min: Number(targetPriceMin) } : {}),
                  ...(targetPriceMax ? { max: Number(targetPriceMax) } : {}),
                }
              : undefined,
          rawMaterialRule: rawMaterialRule || undefined,
          packagingRequirement: packagingRequirement || undefined,
          deliveryRequirement: deliveryRequirement || undefined,
          notes: notes || undefined,
        },
      },
      {
        onSuccess: onSaved,
        onError: () => onError("수정 저장에 실패했습니다."),
      },
    )
  }

  return (
    <div className="surface flex flex-col gap-12">
      <h2 className="section-title">의뢰 수정</h2>
      <div className="input-field">
        <label>의뢰 제목</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="의뢰 제목" />
      </div>
      <div className="flex gap-12 flex-wrap">
        <div className="input-field flex-1">
          <label>희망 수량</label>
          <input
            className="input"
            type="number"
            value={desiredVolume}
            onChange={(e) => setDesiredVolume(e.target.value)}
            placeholder="희망 수량"
          />
        </div>
        <div className="input-field flex-1">
          <label>최소 단가</label>
          <input
            className="input"
            type="number"
            value={targetPriceMin}
            onChange={(e) => setTargetPriceMin(e.target.value)}
            placeholder="최소 단가"
          />
        </div>
        <div className="input-field flex-1">
          <label>최대 단가</label>
          <input
            className="input"
            type="number"
            value={targetPriceMax}
            onChange={(e) => setTargetPriceMax(e.target.value)}
            placeholder="최대 단가"
          />
        </div>
      </div>
      <div className="flex gap-12 flex-wrap">
        <div className="input-field flex-1">
          <label>원재료 규칙</label>
          <select
            className="select"
            value={rawMaterialRule}
            onChange={(e) => setRawMaterialRule(e.target.value as RawMaterialRule)}
          >
            <option value="">원재료 규칙 선택</option>
            <option value="requester_provided">의뢰자 제공</option>
            <option value="supplier_provided">공급자 제공</option>
          </select>
        </div>
        <div className="input-field flex-1">
          <label>포장 요구</label>
          <select
            className="select"
            value={packagingRequirement}
            onChange={(e) => setPackagingRequirement(e.target.value as PackagingRequirement)}
          >
            <option value="">포장 요구 선택</option>
            <option value="private_label">프라이빗 라벨</option>
            <option value="bulk">벌크</option>
            <option value="none">없음</option>
          </select>
        </div>
        <div className="input-field flex-1">
          <label>납기</label>
          <input
            className="input"
            type="date"
            value={deliveryRequirement}
            onChange={(e) => setDeliveryRequirement(e.target.value)}
          />
        </div>
      </div>
      <div className="input-field">
        <label>추가 요구사항</label>
        <textarea
          className="textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="추가 요구사항"
          rows={4}
        />
      </div>
      <div className="flex gap-8">
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSubmit}
          disabled={updateMutation.isPending || title.trim().length < 5 || desiredVolume.trim().length === 0}
        >
          {updateMutation.isPending ? "저장 중..." : "변경 저장"}
        </button>
      </div>
    </div>
  )
}
