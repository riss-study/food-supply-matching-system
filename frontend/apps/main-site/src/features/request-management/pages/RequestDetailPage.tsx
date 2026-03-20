import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import type { RequestState } from "@fsm/types"
import { useRequestDetail } from "../hooks/useRequestDetail"
import { usePublishRequest } from "../hooks/usePublishRequest"
import { useCloseRequest } from "../hooks/useCloseRequest"
import { useCancelRequest } from "../hooks/useCancelRequest"
import { useUpdateRequest } from "../hooks/useUpdateRequest"

const stateLabels: Record<RequestState, string> = {
  draft: "작성 중",
  open: "진행 중",
  closed: "마감",
  cancelled: "취소됨",
}

const stateColors: Record<RequestState, string> = {
  draft: "#6b7280",
  open: "#10b981",
  closed: "#3b82f6",
  cancelled: "#ef4444",
}

function StateBadge({ state }: { state: RequestState }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.375rem 1rem",
        borderRadius: "9999px",
        fontSize: "0.875rem",
        fontWeight: 600,
        backgroundColor: stateColors[state] + "20",
        color: stateColors[state],
      }}
    >
      {stateLabels[state]}
    </span>
  )
}

export function RequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const { data: request, isLoading, error } = useRequestDetail(requestId ?? "")
  const publishMutation = usePublishRequest()
  const closeMutation = useCloseRequest()
  const cancelMutation = useCancelRequest()
  const updateMutation = useUpdateRequest()
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [actionError, setActionError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editDesiredVolume, setEditDesiredVolume] = useState("")
  const [editTargetPriceMin, setEditTargetPriceMin] = useState("")
  const [editTargetPriceMax, setEditTargetPriceMax] = useState("")
  const [editRawMaterialRule, setEditRawMaterialRule] = useState<"requester_provided" | "supplier_provided" | "">("")
  const [editPackagingRequirement, setEditPackagingRequirement] = useState<"private_label" | "bulk" | "none" | "">("")
  const [editDeliveryRequirement, setEditDeliveryRequirement] = useState("")
  const [editNotes, setEditNotes] = useState("")

  useEffect(() => {
    if (!request) return
    setEditTitle(request.title)
    setEditDesiredVolume(String(request.desiredVolume))
    setEditTargetPriceMin(request.targetPriceRange?.min ? String(request.targetPriceRange.min) : "")
    setEditTargetPriceMax(request.targetPriceRange?.max ? String(request.targetPriceRange.max) : "")
    setEditRawMaterialRule(request.rawMaterialRule ?? "")
    setEditPackagingRequirement(request.packagingRequirement ?? "")
    setEditDeliveryRequirement(request.deliveryRequirement ?? "")
    setEditNotes(request.notes ?? "")
  }, [request])

  if (isLoading) {
    return (
      <section>
        <h1>의뢰 상세</h1>
        <p>로딩 중...</p>
      </section>
    )
  }

  if (error || !request) {
    return (
      <section>
        <h1>의뢰 상세</h1>
        <p style={{ color: "#ef4444" }}>의뢰 정보를 불러올 수 없습니다.</p>
        <Link to="/requests">목록으로 돌아가기</Link>
      </section>
    )
  }

  const canEdit = request.state === "draft" || request.state === "open"
  const canPublish = request.state === "draft"
  const canClose = request.state === "open"
  const canCancel = request.state === "draft" || request.state === "open"

  const handlePublish = () => {
    if (!window.confirm("의뢰를 게시하시겠습니까? 게시 후에는 공급자가 의뢰를 볼 수 있습니다.")) return
    setActionError(null)
    publishMutation.mutate(request.requestId, {
      onError: () => setActionError("게시 처리에 실패했습니다."),
    })
  }

  const handleClose = () => {
    if (!window.confirm("의뢰를 마감하시겠습니까? 마감 후에는 더 이상 견적을 받을 수 없습니다.")) return
    setActionError(null)
    closeMutation.mutate(request.requestId, {
      onError: () => setActionError("마감 처리에 실패했습니다."),
    })
  }

  const handleCancel = () => {
    if (!cancelReason.trim()) return
    setActionError(null)
    cancelMutation.mutate(
      { requestId: request.requestId, reason: cancelReason },
      {
        onSuccess: () => setShowCancelConfirm(false),
        onError: () => setActionError("취소 처리에 실패했습니다."),
      },
    )
  }

  const handleUpdate = () => {
    setActionError(null)
    updateMutation.mutate(
      {
        requestId: request.requestId,
        request: {
          title: editTitle,
          desiredVolume: Number(editDesiredVolume),
          targetPriceRange:
            editTargetPriceMin || editTargetPriceMax
              ? {
                  ...(editTargetPriceMin ? { min: Number(editTargetPriceMin) } : {}),
                  ...(editTargetPriceMax ? { max: Number(editTargetPriceMax) } : {}),
                }
              : undefined,
          rawMaterialRule: editRawMaterialRule || undefined,
          packagingRequirement: editPackagingRequirement || undefined,
          deliveryRequirement: editDeliveryRequirement || undefined,
          notes: editNotes || undefined,
        },
      },
      {
        onSuccess: () => setEditMode(false),
        onError: () => setActionError("수정 저장에 실패했습니다."),
      },
    )
  }

  return (
    <section>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link to="/requests" style={{ color: "#6b7280", textDecoration: "none", fontSize: "0.875rem" }}>
          ← 목록으로 돌아가기
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>{request.title}</h1>
            <StateBadge state={request.state} />
          </div>
          <div style={{ display: "flex", gap: "1rem", color: "#6b7280", fontSize: "0.875rem" }}>
            <span>의뢰 ID: {request.requestId}</span>
            <span>•</span>
            <span>모드: {request.mode === "public" ? "공개" : "지정"}</span>
            <span>•</span>
            <span>생성일: {new Date(request.createdAt).toLocaleDateString("ko-KR")}</span>
          </div>
        </div>

        {canEdit && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setEditMode((current) => !current)}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "transparent",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                cursor: "pointer",
              }}
            >
              {editMode ? "수정 취소" : "수정하기"}
            </button>
            {canPublish && (
              <button
                onClick={handlePublish}
                disabled={publishMutation.isPending}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#111827",
                  color: "white",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                }}
              >
                {publishMutation.isPending ? "처리 중..." : "게시하기"}
              </button>
            )}
            {canClose && (
              <button
                onClick={handleClose}
                disabled={closeMutation.isPending}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                }}
              >
                {closeMutation.isPending ? "처리 중..." : "마감하기"}
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "transparent",
                  color: "#ef4444",
                  border: "1px solid #ef4444",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                }}
              >
                취소
              </button>
            )}
          </div>
        )}
      </div>

      {editMode && (
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "1.25rem",
            backgroundColor: "#f8fafc",
            borderRadius: "0.75rem",
            border: "1px solid #e2e8f0",
            display: "grid",
            gap: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>의뢰 수정</h2>
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="의뢰 제목"
            style={{ padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
          />
          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <input
              type="number"
              value={editDesiredVolume}
              onChange={(e) => setEditDesiredVolume(e.target.value)}
              placeholder="희망 수량"
              style={{ padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
            />
            <input
              type="number"
              value={editTargetPriceMin}
              onChange={(e) => setEditTargetPriceMin(e.target.value)}
              placeholder="최소 단가"
              style={{ padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
            />
            <input
              type="number"
              value={editTargetPriceMax}
              onChange={(e) => setEditTargetPriceMax(e.target.value)}
              placeholder="최대 단가"
              style={{ padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
            />
          </div>
          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <select
              value={editRawMaterialRule}
              onChange={(e) => setEditRawMaterialRule(e.target.value as typeof editRawMaterialRule)}
              style={{ padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
            >
              <option value="">원재료 규칙 선택</option>
              <option value="requester_provided">의뢰자 제공</option>
              <option value="supplier_provided">공급자 제공</option>
            </select>
            <select
              value={editPackagingRequirement}
              onChange={(e) => setEditPackagingRequirement(e.target.value as typeof editPackagingRequirement)}
              style={{ padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
            >
              <option value="">포장 요구 선택</option>
              <option value="private_label">프라이빗 라벨</option>
              <option value="bulk">벌크</option>
              <option value="none">없음</option>
            </select>
            <input
              type="date"
              value={editDeliveryRequirement}
              onChange={(e) => setEditDeliveryRequirement(e.target.value)}
              style={{ padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
            />
          </div>
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="추가 요구사항"
            rows={4}
            style={{ padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", resize: "vertical" }}
          />
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={handleUpdate}
              disabled={updateMutation.isPending || editTitle.trim().length < 5 || Number(editDesiredVolume) <= 0}
              style={{
                padding: "0.625rem 1rem",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
              }}
            >
              {updateMutation.isPending ? "저장 중..." : "변경 저장"}
            </button>
          </div>
        </div>
      )}

      {actionError && (
        <div
          style={{
            padding: "0.75rem",
            backgroundColor: "#fee2e2",
            color: "#ef4444",
            borderRadius: "0.375rem",
            marginBottom: "1rem",
          }}
        >
          {actionError}
        </div>
      )}

      {showCancelConfirm && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "0.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h3 style={{ margin: "0 0 0.75rem", color: "#991b1b" }}>의뢰 취소</h3>
          <p style={{ margin: "0 0 0.75rem", color: "#7f1d1d" }}>의뢰를 취소하시겠습니까? 취소된 의뢰는 복구할 수 없습니다.</p>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem", color: "#7f1d1d" }}>
              취소 사유 (선택사항)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="취소 사유를 입력해주세요"
              maxLength={500}
              rows={2}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #fca5a5" }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
              }}
            >
              {cancelMutation.isPending ? "처리 중..." : "확인"}
            </button>
            <button
              onClick={() => {
                setShowCancelConfirm(false)
                setCancelReason("")
              }}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "transparent",
                color: "#6b7280",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                cursor: "pointer",
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gap: "1.5rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        }}
      >
        <div style={{ padding: "1.25rem", backgroundColor: "white", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
          <h2 style={{ margin: "0 0 1rem", fontSize: "1.125rem", fontWeight: 600 }}>의뢰 정보</h2>
          <dl style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "0.75rem 1rem", margin: 0 }}>
            <dt style={{ color: "#6b7280", fontSize: "0.875rem" }}>카테고리</dt>
            <dd style={{ margin: 0 }}>{request.category}</dd>

            <dt style={{ color: "#6b7280", fontSize: "0.875rem" }}>희망 수량</dt>
            <dd style={{ margin: 0 }}>{request.desiredVolume.toLocaleString()}개</dd>

            {request.targetPriceRange && (
              <>
                <dt style={{ color: "#6b7280", fontSize: "0.875rem" }}>희망 단가</dt>
                <dd style={{ margin: 0 }}>
                  {request.targetPriceRange.min && request.targetPriceRange.max
                    ? `${request.targetPriceRange.min.toLocaleString()}원 ~ ${request.targetPriceRange.max.toLocaleString()}원`
                    : request.targetPriceRange.min
                      ? `${request.targetPriceRange.min.toLocaleString()}원 이상`
                      : request.targetPriceRange.max
                        ? `${request.targetPriceRange.max.toLocaleString()}원 이하`
                        : "미지정"}
                </dd>
              </>
            )}

            {request.certificationRequirement?.length > 0 && (
              <>
                <dt style={{ color: "#6b7280", fontSize: "0.875rem" }}>필요 인증</dt>
                <dd style={{ margin: 0 }}>{request.certificationRequirement.join(", ")}</dd>
              </>
            )}

            {request.rawMaterialRule && (
              <>
                <dt style={{ color: "#6b7280", fontSize: "0.875rem" }}>원재료 규칙</dt>
                <dd style={{ margin: 0 }}>
                  {request.rawMaterialRule === "requester_provided" ? "의뢰자 제공" : "공급자 제공"}
                </dd>
              </>
            )}

            {request.packagingRequirement && (
              <>
                <dt style={{ color: "#6b7280", fontSize: "0.875rem" }}>포장/라벨링</dt>
                <dd style={{ margin: 0 }}>
                  {request.packagingRequirement === "private_label"
                    ? "프라이빗 라벨"
                    : request.packagingRequirement === "bulk"
                      ? "벌크"
                      : "없음"}
                </dd>
              </>
            )}

            {request.deliveryRequirement && (
              <>
                <dt style={{ color: "#6b7280", fontSize: "0.875rem" }}>납기</dt>
                <dd style={{ margin: 0 }}>{new Date(request.deliveryRequirement).toLocaleDateString("ko-KR")}</dd>
              </>
            )}
          </dl>
        </div>

        <div style={{ padding: "1.25rem", backgroundColor: "white", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
          <h2 style={{ margin: "0 0 1rem", fontSize: "1.125rem", fontWeight: 600 }}>의뢰자 정보</h2>
          <dl style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "0.75rem 1rem", margin: 0 }}>
            <dt style={{ color: "#6b7280", fontSize: "0.875rem" }}>상호명</dt>
            <dd style={{ margin: 0 }}>{request.requester.businessName}</dd>

            <dt style={{ color: "#6b7280", fontSize: "0.875rem" }}>담당자</dt>
            <dd style={{ margin: 0 }}>{request.requester.contactName}</dd>
          </dl>
        </div>
      </div>

      {request.notes && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1.25rem",
            backgroundColor: "white",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.125rem", fontWeight: 600 }}>추가 요구사항</h2>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{request.notes}</p>
        </div>
      )}

      {request.mode === "targeted" && request.targetSuppliers.length > 0 && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1.25rem",
            backgroundColor: "white",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.125rem", fontWeight: 600 }}>지정 공급자</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {request.targetSuppliers.map((supplier) => (
              <span
                key={supplier.supplierProfileId}
                style={{
                  padding: "0.375rem 0.75rem",
                  backgroundColor: "#eff6ff",
                  color: "#1e40af",
                  borderRadius: "9999px",
                  fontSize: "0.875rem",
                }}
              >
                {supplier.companyName}
              </span>
            ))}
          </div>
        </div>
      )}

      {request.state === "open" && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1.25rem",
            backgroundColor: "#f0fdf4",
            borderRadius: "0.5rem",
            border: "1px solid #bbf7d0",
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 600, color: "#166534" }}>견적 현황</h3>
          <p style={{ margin: 0, color: "#166534" }}>
            이 의뢰에 대한 견적 목록은 견적 관리 메뉴에서 확인할 수 있습니다.
            <br />
            <Link to={`/requests/${request.requestId}/quotes`} style={{ color: "#15803d", textDecoration: "underline" }}>
              견적 보기 →
            </Link>
          </p>
        </div>
      )}
    </section>
  )
}
