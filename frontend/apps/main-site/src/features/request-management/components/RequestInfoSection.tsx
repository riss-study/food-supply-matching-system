import type { RequestDetail } from "@fsm/types"

interface Props {
  request: RequestDetail
  onCreateThread: (supplierId: string) => void
  createThreadPending: boolean
}

function formatPriceRange(range: RequestDetail["targetPriceRange"]) {
  if (!range) return "미지정"
  if (range.min && range.max) return `${range.min.toLocaleString()} ~ ${range.max.toLocaleString()}원/kg`
  if (range.min) return `${range.min.toLocaleString()}원 이상`
  if (range.max) return `${range.max.toLocaleString()}원 이하`
  return "미지정"
}

function formatRawMaterialRule(rule: RequestDetail["rawMaterialRule"]) {
  return rule === "requester_provided" ? "요청자 지급" : "공급자 조달"
}

function formatPackagingRequirement(req: RequestDetail["packagingRequirement"]) {
  if (req === "private_label") return "개별 포장 + 박스 포장"
  if (req === "bulk") return "벌크"
  return "없음"
}

export function RequestInfoSection({ request, onCreateThread, createThreadPending }: Props) {
  return (
    <div className="flex flex-col gap-20">
      <div className="surface">
        <h2 className="section-title mb-12">의뢰 상세</h2>
        <dl className="detail-grid">
          <dt>희망 수량</dt>
          <dd>{request.desiredVolume}</dd>
          {request.targetPriceRange && (
            <>
              <dt>목표 단가</dt>
              <dd>{formatPriceRange(request.targetPriceRange)}</dd>
            </>
          )}
          {request.rawMaterialRule && (
            <>
              <dt>원료 규정</dt>
              <dd>{formatRawMaterialRule(request.rawMaterialRule)}</dd>
            </>
          )}
          {request.packagingRequirement && (
            <>
              <dt>포장 요구</dt>
              <dd>{formatPackagingRequirement(request.packagingRequirement)}</dd>
            </>
          )}
          {request.deliveryRequirement && (
            <>
              <dt>납품 조건</dt>
              <dd>{request.deliveryRequirement}</dd>
            </>
          )}
          {request.certificationRequirement?.length > 0 && (
            <>
              <dt>인증 요구</dt>
              <dd>{request.certificationRequirement.join(", ")}</dd>
            </>
          )}
        </dl>
      </div>

      <div className="surface">
        <h2 className="section-title mb-12">의뢰자 정보</h2>
        <dl className="flex flex-col gap-10">
          <div className="flex justify-between">
            <dt className="text-muted text-sm">상호명</dt>
            <dd>{request.requester.businessName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted text-sm">담당자</dt>
            <dd>{request.requester.contactName}</dd>
          </div>
        </dl>
      </div>

      {request.notes && (
        <div className="surface">
          <h2 className="section-title mb-8">추가 요구사항</h2>
          <p className="text-muted">{request.notes}</p>
        </div>
      )}

      {request.mode === "targeted" && request.targetSuppliers.length > 0 && (
        <div className="surface">
          <h2 className="section-title mb-12">지정 공급자</h2>
          <div className="flex flex-col gap-8">
            {request.targetSuppliers.map((supplier) => (
              <div
                key={supplier.supplierProfileId}
                className="flex items-center justify-between gap-8 p-12 bg-accent-soft rounded"
              >
                <span className="font-semibold text-sm">{supplier.companyName}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => onCreateThread(supplier.supplierProfileId)}
                  disabled={createThreadPending}
                >
                  대화 시작
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
