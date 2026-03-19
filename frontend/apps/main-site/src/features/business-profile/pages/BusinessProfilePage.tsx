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

const statusColors: Record<BusinessApprovalState, string> = {
  not_submitted: "#6b7280",
  submitted: "#f59e0b",
  approved: "#10b981",
  rejected: "#ef4444",
}

function StatusBadge({ state }: { state: BusinessApprovalState }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.25rem 0.75rem",
        borderRadius: "9999px",
        fontSize: "0.875rem",
        fontWeight: 500,
        backgroundColor: statusColors[state] + "20",
        color: statusColors[state],
      }}
    >
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
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "400px" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>상호명</span>
        <input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="2-100자"
          minLength={2}
          maxLength={100}
          required
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>사업자등록번호</span>
        <input
          value={businessRegistrationNumber}
          onChange={(e) => setBusinessRegistrationNumber(formatRegistrationNumber(e.target.value))}
          placeholder="000-00-00000"
          required
        />
        {!isValidRegistrationNumber(businessRegistrationNumber) && businessRegistrationNumber && (
          <span style={{ color: "#ef4444", fontSize: "0.875rem" }}>올바른 형식이 아닙니다 (000-00-00000)</span>
        )}
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>담당자 이름</span>
        <input value={contactName} onChange={(e) => setContactName(e.target.value)} required />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>담당자 연락처</span>
        <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>담당자 이메일</span>
        <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
      </label>

      <button type="submit" disabled={!isFormValid || isPending}>
        {isPending ? "처리 중..." : submitLabel}
      </button>
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
      <section>
        <h1>사업자 정보</h1>
        <p>로딩 중...</p>
      </section>
    )
  }

  if (!profile || profile.approvalState === "not_submitted") {
    return (
      <section>
        <h1>사업자 정보 등록</h1>
        <p style={{ marginBottom: "1rem" }}>의뢰를 등록하려면 사업자 정보를 제출해야 합니다.</p>
        <BusinessProfileForm
          onSubmit={(data) => submitMutation.mutate(data)}
          isPending={submitMutation.isPending}
          submitLabel="제출하기"
        />
        {submitMutation.isError && <p style={{ color: "#ef4444", marginTop: "1rem" }}>제출에 실패했습니다.</p>}
      </section>
    )
  }

  const canEdit = profile.approvalState === "submitted" || profile.approvalState === "rejected"

  return (
    <section>
      <h1>사업자 정보 관리</h1>

      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <span>승인 상태:</span>
          <StatusBadge state={profile.approvalState} />
        </div>

        {profile.approvalState === "submitted" && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#fef3c7",
              borderRadius: "0.375rem",
              marginBottom: "1rem",
            }}
          >
            <p style={{ margin: 0 }}>승인 대기 중입니다. 관리자 검토 후 의뢰 생성이 가능합니다.</p>
          </div>
        )}

        {profile.approvalState === "approved" && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#d1fae5",
              borderRadius: "0.375rem",
              marginBottom: "1rem",
            }}
          >
            <p style={{ margin: 0 }}>승인이 완료되었습니다. 의뢰 생성이 가능합니다.</p>
            <Link to="/requests/new" style={{ display: "inline-block", marginTop: "0.5rem" }}>
              새 의뢰 등록하기 →
            </Link>
          </div>
        )}

        {profile.approvalState === "rejected" && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#fee2e2",
              borderRadius: "0.375rem",
              marginBottom: "1rem",
            }}
          >
            <p style={{ margin: 0 }}>반려되었습니다. 아래 사유를 확인하고 수정해 주세요.</p>
            {profile.rejectionReason && (
              <p style={{ margin: "0.5rem 0 0", fontWeight: 500 }}>사유: {profile.rejectionReason}</p>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div>
          <h2>정보 수정</h2>
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
          <button
            onClick={() => setIsEditing(false)}
            style={{ marginTop: "0.5rem", backgroundColor: "transparent", color: "#374151" }}
          >
            취소
          </button>
          {updateMutation.isError && <p style={{ color: "#ef4444", marginTop: "1rem" }}>수정에 실패했습니다.</p>}
        </div>
      ) : (
        <div>
          <h2>등록된 정보</h2>
          <dl style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "0.5rem 1rem" }}>
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
            <button onClick={() => setIsEditing(true)} style={{ marginTop: "1rem" }}>
              정보 수정
            </button>
          )}
        </div>
      )}
    </section>
  )
}
