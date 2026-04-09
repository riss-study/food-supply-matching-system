import { useState } from "react"

type Role = "requester" | "supplier" | "admin"
type MemberStatus = "active" | "suspended"

interface Member {
  memberId: string
  email: string
  role: Role
  joinedAt: string
  status: MemberStatus
}

const roleTabs = [
  { value: "", label: "전체" },
  { value: "requester", label: "요청자" },
  { value: "supplier", label: "공급자" },
  { value: "admin", label: "관리자" },
] as const

const roleLabel: Record<Role, string> = {
  requester: "요청자",
  supplier: "공급자",
  admin: "관리자",
}

const roleBadge: Record<Role, string> = {
  requester: "badge badge-blue",
  supplier: "badge badge-green",
  admin: "badge badge-gray",
}

const statusLabel: Record<MemberStatus, string> = {
  active: "활성",
  suspended: "정지",
}

const statusBadge: Record<MemberStatus, string> = {
  active: "badge badge-green",
  suspended: "badge badge-gray",
}

/* ── Mock data (replace with API hook later) ── */
const MOCK_MEMBERS: Member[] = [
  { memberId: "m1", email: "buyer1@example.com", role: "requester", joinedAt: "2025-11-01T09:00:00Z", status: "active" },
  { memberId: "m2", email: "buyer2@example.com", role: "requester", joinedAt: "2025-12-15T10:30:00Z", status: "active" },
  { memberId: "m3", email: "supplier1@foodco.kr", role: "supplier", joinedAt: "2025-10-20T08:00:00Z", status: "active" },
  { memberId: "m4", email: "supplier2@freshmarket.kr", role: "supplier", joinedAt: "2026-01-05T14:00:00Z", status: "suspended" },
  { memberId: "m5", email: "admin@food2008.kr", role: "admin", joinedAt: "2025-09-01T00:00:00Z", status: "active" },
  { memberId: "m6", email: "buyer3@company.com", role: "requester", joinedAt: "2026-02-10T11:00:00Z", status: "active" },
  { memberId: "m7", email: "supplier3@meats.kr", role: "supplier", joinedAt: "2026-03-01T09:00:00Z", status: "active" },
]

const PAGE_SIZE = 20

export function MemberListPage() {
  const [roleFilter, setRoleFilter] = useState("")
  const [page, setPage] = useState(1)

  const filtered = roleFilter
    ? MOCK_MEMBERS.filter((m) => m.role === roleFilter)
    : MOCK_MEMBERS

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="page">
      <div className="page-header">
        <h1>회원 목록</h1>
      </div>

      <div className="tab-filters">
        {roleTabs.map((tab) => (
          <button
            key={tab.value}
            className={`btn btn-ghost btn-sm${roleFilter === tab.value ? " active" : ""}`}
            onClick={() => { setRoleFilter(tab.value); setPage(1) }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="surface">
        <table className="data-table">
          <thead>
            <tr>
              <th>이메일</th>
              <th>역할</th>
              <th>가입일</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center" }}>
                  회원이 없습니다.
                </td>
              </tr>
            ) : (
              paged.map((member) => (
                <tr key={member.memberId}>
                  <td data-label="이메일">{member.email}</td>
                  <td data-label="역할">
                    <span className={roleBadge[member.role]}>
                      {roleLabel[member.role]}
                    </span>
                  </td>
                  <td data-label="가입일">{new Date(member.joinedAt).toLocaleDateString("ko-KR")}</td>
                  <td data-label="상태">
                    <span className={statusBadge[member.status]}>
                      {statusLabel[member.status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages >= 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
        </div>
      )}
    </div>
  )
}
