import { useState } from "react"
import { Link } from "react-router-dom"
import type { BusinessApprovalState } from "@fsm/types"
import { useBusinessProfile } from "../hooks/useBusinessProfile"
import { useSubmitBusinessProfile } from "../hooks/useSubmitBusinessProfile"
import { useUpdateBusinessProfile } from "../hooks/useUpdateBusinessProfile"

const statusLabels: Record<BusinessApprovalState, string> = {
  not_submitted: "미제출",
  submitted: "승인 대기 중",
  approved: "승인 완료",
  rejected: "반려됨",
}

const statusBadgeClass: Record<BusinessApprovalState, string> = {
  not_submitted: "badge badge-gray",
  submitted: "badge badge-amber",
  approved: "badge badge-green",
  rejected: "badge badge-red",
}

function StatusBadge({ state }: { state: BusinessApprovalState }) {
  return (
    <span className={statusBadgeClass[state]}>
      {statusLabels[state]}
    </span>
  )
}

function BusinessProfileForm({
  initialData,
  onSubmit,
  isPending,
  submitLabel,
}: {
  initialData?: {
    businessName: string
    businessRegistrationNumber: string
    contactName: string
    contactPhone: string
    contactEmail: string
  }
  onSubmit: (data: {
    businessName: string
    businessRegistrationNumber: string
    contactName: string
    contactPhone: string
    contactEmail: string
    verificationScope: string
  }) => void
  isPending: boolean
  submitLabel: string
}) {
  const [businessName, setBusinessName] = useState(initialData?.businessName ?? "")
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState(
    initialData?.businessRegistrationNumber ?? "",
  )
  const [contactName, setContactName] = useState(initialData?.contactName ?? "")
  const [contactPhone, setContactPhone] = useState(initialData?.contactPhone ?? "")
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail ?? "")

  const isValidRegistrationNumber = (number: string) => {
    const regex = /^\d{3}-\d{2}-\d{5}$|^\d{10}$/
    return regex.test(number)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      businessName,
      businessRegistrationNumber,
      contactName,
      contactPhone,
      contactEmail,
      verificationScope: "domestic",
    })
  }

  const formatRegistrationNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 10)
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5)}`
  }

  const isFormValid =
    businessName.length >= 2 &&
    businessName.length <= 100 &&
    isValidRegistrationNumber(businessRegistrationNumber) &&
    contactName.length > 0 &&
    contactPhone.length > 0 &&
    contactEmail.length > 0

  return (
    <form className="surface" onSubmit={handleSubmit}>
      <div className="form-stack">
        <div className="input-field">
          <label>상호명</label>
          <input
            className="input"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="2-100자"
            minLength={2}
            maxLength={100}
            required
          />
        </div>

        <div className="input-field">
          <label>사업자등록번호</label>
          <input
            className="input"
            value={businessRegistrationNumber}
            onChange={(e) => setBusinessRegistrationNumber(formatRegistrationNumber(e.target.value))}
            placeholder="000-00-00000"
            required
          />
          {!isValidRegistrationNumber(businessRegistrationNumber) && businessRegistrationNumber && (
            <span className="text-danger text-sm">올바른 형식이 아닙니다 (000-00-00000)</span>
          )}
        </div>

        <div className="input-field">
          <label>담당자 이름</label>
          <input className="input" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
        </div>

        <div className="input-field">
          <label>담당자 연락처</label>
          <input className="input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
        </div>

        <div className="input-field">
          <label>담당자 이메일</label>
          <input className="input" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
        </div>

        <button className="btn btn-primary" type="submit" disabled={!isFormValid || isPending}>
          {isPending ? "처리 중..." : submitLabel}
        </button>
      </div>
    </form>
  )
}

export function BusinessProfilePage() {
  const { data: profile, isLoading } = useBusinessProfile()
  const submitMutation = useSubmitBusinessProfile()
  const updateMutation = useUpdateBusinessProfile()
  const [isEditing, setIsEditing] = useState(false)

  if (isLoading) {
    return (
      <div className="page">
        <div className="page-header"><h1>사업자 정보</h1></div>
        <p>로딩 중...</p>
      </div>
    )
  }

  if (!profile || profile.approvalState === "not_submitted") {
    return (
      <div className="page items-center">
        <div className="content-narrow">
        <div className="page-header">
          <div className="page-header-text">
            <h1>사업자 정보 등록</h1>
            <p>의뢰를 등록하려면 사업자 정보를 먼저 제출하고 승인 상태를 확인해야 합니다.</p>
          </div>
        </div>
        <BusinessProfileForm
          onSubmit={(data) => submitMutation.mutate(data)}
          isPending={submitMutation.isPending}
          submitLabel="제출하기"
        />
        {submitMutation.isError && <p className="text-danger">제출에 실패했습니다.</p>}
        </div>
      </div>
    )
  }

  const canEdit = profile.approvalState === "submitted" || profile.approvalState === "rejected"

  return (
    <div className="page items-center">
      <div className="content-narrow flex flex-col gap-24">
      <div className="page-header">
        <div className="page-header-text">
          <h1>사업자 정보 관리</h1>
        </div>
      </div>

      <div className="surface">
        <div className="flex items-center gap-12 mb-16">
          <span className="text-muted">승인 상태:</span>
          <StatusBadge state={profile.approvalState} />
        </div>

        {profile.approvalState === "submitted" && (
          <div className="surface-highlight p-16 rounded mb-16">
            <p>승인 대기 중입니다. 관리자 검토 후 의뢰 생성이 가능합니다.</p>
          </div>
        )}

        {profile.approvalState === "approved" && (
          <div className="surface-highlight p-16 rounded mb-16">
            <p>승인이 완료되었습니다. 의뢰 생성이 가능합니다.</p>
            <Link to="/requests/new" className="btn btn-primary btn-sm mt-8">
              새 의뢰 등록하기
            </Link>
          </div>
        )}

        {profile.approvalState === "rejected" && (
          <div className="surface surface-highlight p-16 rounded mb-16">
            <p className="text-danger">반려되었습니다. 아래 사유를 확인하고 수정해 주세요.</p>
            {profile.rejectionReason && (
              <p className="font-medium mt-4">사유: {profile.rejectionReason}</p>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="surface">
          <h2 className="section-title mb-16">정보 수정</h2>
          <BusinessProfileForm
            initialData={{
              businessName: profile.businessName,
              businessRegistrationNumber: profile.businessRegistrationNumber,
              contactName: profile.contactName,
              contactPhone: profile.contactPhone,
              contactEmail: profile.contactEmail,
            }}
            onSubmit={(data) => {
              updateMutation.mutate(data, {
                onSuccess: () => setIsEditing(false),
              })
            }}
            isPending={updateMutation.isPending}
            submitLabel="수정하기"
          />
          <button className="btn btn-ghost mt-8" onClick={() => setIsEditing(false)}>
            취소
          </button>
          {updateMutation.isError && <p className="text-danger mt-12">수정에 실패했습니다.</p>}
        </div>
      ) : (
        <div className="surface">
          <h2 className="section-title mb-16">등록된 정보</h2>
          <dl className="detail-grid">
            <dt>상호명</dt>
            <dd>{profile.businessName}</dd>
            <dt>사업자등록번호</dt>
            <dd>{profile.businessRegistrationNumber}</dd>
            <dt>담당자</dt>
            <dd>{profile.contactName}</dd>
            <dt>연락처</dt>
            <dd>{profile.contactPhone}</dd>
            <dt>이메일</dt>
            <dd>{profile.contactEmail}</dd>
            <dt>제출일</dt>
            <dd>{profile.submittedAt ? new Date(profile.submittedAt).toLocaleDateString("ko-KR") : "-"}</dd>
            {profile.approvedAt && (
              <>
                <dt>승인일</dt>
                <dd>{new Date(profile.approvedAt).toLocaleDateString("ko-KR")}</dd>
              </>
            )}
          </dl>
          {canEdit && (
            <button className="btn btn-secondary mt-16" onClick={() => setIsEditing(true)}>
              정보 수정
            </button>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
