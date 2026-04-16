import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import type { RequestState } from "@fsm/types"
import { useRequestDetail } from "../hooks/useRequestDetail"
import { usePublishRequest } from "../hooks/usePublishRequest"
import { useCloseRequest } from "../hooks/useCloseRequest"
import { useCancelRequest } from "../hooks/useCancelRequest"
import { useUpdateRequest } from "../hooks/useUpdateRequest"
import { useCreateThread } from "../../threads"

const stateLabels: Record<RequestState, string> = {
  draft: "작성 중",
  open: "진행 중",
  closed: "마감",
  cancelled: "취소됨",
}

const stateBadgeClass: Record<RequestState, string> = {
  draft: "badge badge-gray",
  open: "badge badge-green",
  closed: "badge badge-blue",
  cancelled: "badge badge-red",
}

function StateBadge({ state }: { state: RequestState }) {
  return <span className={stateBadgeClass[state]}>{stateLabels[state]}</span>
}

export function RequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  const { data: request, isLoading, error } = useRequestDetail(requestId ?? "")
  const publishMutation = usePublishRequest()
  const closeMutation = useCloseRequest()
  const cancelMutation = useCancelRequest()
  const updateMutation = useUpdateRequest()
  const createThreadMutation = useCreateThread(requestId ?? "")
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
      <div className="page">
        <h1>의뢰 상세</h1>
        <p className="text-muted">로딩 중...</p>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="page">
        <h1>의뢰 상세</h1>
        <p className="text-danger">의뢰 정보를 불러올 수 없습니다.</p>
        <Link to="/requests" className="btn btn-ghost btn-sm">목록으로 돌아가기</Link>
      </div>
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
          desiredVolume: editDesiredVolume.trim(),
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

  const handleCreateThread = (supplierId: string) => {
    if (!requestId) return
    setActionError(null)
    createThreadMutation.mutate(
      { supplierId },
      {
        onSuccess: (response) => navigate(`/threads/${response.threadId}`),
        onError: () => setActionError("대화방 생성에 실패했습니다."),
      },
    )
  }

  return (
    <div className="page">
      <Link to="/requests" className="btn btn-ghost btn-sm">← 목록으로 돌아가기</Link>

      {/* Title area */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-10">
          <h1 className="text-xl font-bold">{request.title}</h1>
          <StateBadge state={request.state} />
        </div>
        <div className="flex gap-12 text-muted text-sm">
          <span>{request.category}</span>
          <span>·</span>
          <span>{request.mode === "public" ? "공개" : "지정"}</span>
          <span>·</span>
          <span>{new Date(request.createdAt).toLocaleDateString("ko-KR")} 등록</span>
        </div>
      </div>

      {/* Edit form */}
      {editMode && (
        <div className="surface flex flex-col gap-12">
          <h2 className="section-title">의뢰 수정</h2>
          <div className="input-field">
            <label>의뢰 제목</label>
            <input className="input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="의뢰 제목" />
          </div>
          <div className="flex gap-12 flex-wrap">
            <div className="input-field flex-1">
              <label>희망 수량</label>
              <input className="input" type="number" value={editDesiredVolume} onChange={(e) => setEditDesiredVolume(e.target.value)} placeholder="희망 수량" />
            </div>
            <div className="input-field flex-1">
              <label>최소 단가</label>
              <input className="input" type="number" value={editTargetPriceMin} onChange={(e) => setEditTargetPriceMin(e.target.value)} placeholder="최소 단가" />
            </div>
            <div className="input-field flex-1">
              <label>최대 단가</label>
              <input className="input" type="number" value={editTargetPriceMax} onChange={(e) => setEditTargetPriceMax(e.target.value)} placeholder="최대 단가" />
            </div>
          </div>
          <div className="flex gap-12 flex-wrap">
            <div className="input-field flex-1">
              <label>원재료 규칙</label>
              <select className="select" value={editRawMaterialRule} onChange={(e) => setEditRawMaterialRule(e.target.value as typeof editRawMaterialRule)}>
                <option value="">원재료 규칙 선택</option>
                <option value="requester_provided">의뢰자 제공</option>
                <option value="supplier_provided">공급자 제공</option>
              </select>
            </div>
            <div className="input-field flex-1">
              <label>포장 요구</label>
              <select className="select" value={editPackagingRequirement} onChange={(e) => setEditPackagingRequirement(e.target.value as typeof editPackagingRequirement)}>
                <option value="">포장 요구 선택</option>
                <option value="private_label">프라이빗 라벨</option>
                <option value="bulk">벌크</option>
                <option value="none">없음</option>
              </select>
            </div>
            <div className="input-field flex-1">
              <label>납기</label>
              <input className="input" type="date" value={editDeliveryRequirement} onChange={(e) => setEditDeliveryRequirement(e.target.value)} />
            </div>
          </div>
          <div className="input-field">
            <label>추가 요구사항</label>
            <textarea className="textarea" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="추가 요구사항" rows={4} />
          </div>
          <div className="flex gap-8">
            <button
              className="btn btn-primary btn-sm"
              onClick={handleUpdate}
              disabled={updateMutation.isPending || editTitle.trim().length < 5 || editDesiredVolume.trim().length === 0}
            >
              {updateMutation.isPending ? "저장 중..." : "변경 저장"}
            </button>
          </div>
        </div>
      )}

      {/* Error banner */}
      {actionError && (
        <div className="surface" role="alert">
          <p className="text-danger">{actionError}</p>
        </div>
      )}

      {/* Cancel confirm */}
      {showCancelConfirm && (
        <div className="surface flex flex-col gap-12">
          <h3 className="font-semibold text-danger">의뢰 취소</h3>
          <p className="text-muted">의뢰를 취소하시겠습니까? 취소된 의뢰는 복구할 수 없습니다.</p>
          <div className="input-field">
            <label>취소 사유 (선택사항)</label>
            <textarea
              className="textarea"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="취소 사유를 입력해주세요"
              maxLength={500}
              rows={2}
            />
          </div>
          <div className="flex gap-8">
            <button className="btn btn-danger btn-sm" onClick={handleCancel} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? "처리 중..." : "확인"}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setShowCancelConfirm(false); setCancelReason("") }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Two column detail */}
      <div className="two-col-sidebar-r">
        {/* Left: detail info */}
        <div className="flex flex-col gap-20">
          <div className="surface">
            <h2 className="section-title mb-12">의뢰 상세</h2>
            <dl className="detail-grid">
              <dt>희망 수량</dt><dd>{request.desiredVolume}</dd>
              {request.targetPriceRange && (
                <>
                  <dt>목표 단가</dt>
                  <dd>
                    {request.targetPriceRange.min && request.targetPriceRange.max
                      ? `${request.targetPriceRange.min.toLocaleString()} ~ ${request.targetPriceRange.max.toLocaleString()}원/kg`
                      : request.targetPriceRange.min
                        ? `${request.targetPriceRange.min.toLocaleString()}원 이상`
                        : request.targetPriceRange.max
                          ? `${request.targetPriceRange.max.toLocaleString()}원 이하`
                          : "미지정"}
                  </dd>
                </>
              )}
              {request.rawMaterialRule && (
                <>
                  <dt>원료 규정</dt>
                  <dd>{request.rawMaterialRule === "requester_provided" ? "요청자 지급" : "공급자 조달"}</dd>
                </>
              )}
              {request.packagingRequirement && (
                <>
                  <dt>포장 요구</dt>
                  <dd>{request.packagingRequirement === "private_label" ? "개별 포장 + 박스 포장" : request.packagingRequirement === "bulk" ? "벌크" : "없음"}</dd>
                </>
              )}
              {request.deliveryRequirement && (
                <>
                  <dt>납품 조건</dt><dd>{request.deliveryRequirement}</dd>
                </>
              )}
              {request.certificationRequirement?.length > 0 && (
                <>
                  <dt>인증 요구</dt><dd>{request.certificationRequirement.join(", ")}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="surface">
            <h2 className="section-title mb-12">의뢰자 정보</h2>
            <dl className="flex flex-col gap-10">
              <div className="flex justify-between"><dt className="text-muted text-sm">상호명</dt><dd>{request.requester.businessName}</dd></div>
              <div className="flex justify-between"><dt className="text-muted text-sm">담당자</dt><dd>{request.requester.contactName}</dd></div>
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
                  <div key={supplier.supplierProfileId} className="flex items-center justify-between gap-8 p-12 bg-accent-soft rounded">
                    <span className="font-semibold text-sm">{supplier.companyName}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleCreateThread(supplier.supplierProfileId)}
                      disabled={createThreadMutation.isPending}
                    >
                      대화 시작
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="flex flex-col gap-16">
          <div className="surface flex flex-col items-center gap-12" style={{ textAlign: "center" }}>
            <h3 className="section-title">받은 견적</h3>
            {(request.quoteCount ?? 0) > 0 ? (
              <>
                <p style={{ fontSize: 36, fontWeight: 700, color: "var(--ink)" }}>
                  {request.quoteCount}건
                </p>
                {request.state === "open" && (
                  <Link to={`/requests/${request.requestId}/quotes`} className="btn btn-primary w-full">
                    견적 비교
                  </Link>
                )}
              </>
            ) : (
              <p className="text-muted text-sm">아직 견적이 없습니다</p>
            )}
          </div>

          {canPublish && (
            <button
              className="btn btn-primary w-full"
              onClick={handlePublish}
              disabled={publishMutation.isPending}
            >
              {publishMutation.isPending ? "게시 중..." : "의뢰 게시하기"}
            </button>
          )}

          {(canEdit || canClose) && (
            <div className="flex gap-8 justify-center">
              {canEdit && (
                <button
                  className="btn btn-secondary"
                  onClick={() => setEditMode((current) => !current)}
                >
                  수정
                </button>
              )}
              {canClose && (
                <button
                  className="btn btn-danger"
                  onClick={handleClose}
                  disabled={closeMutation.isPending}
                >
                  {closeMutation.isPending ? "처리 중..." : "마감"}
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
