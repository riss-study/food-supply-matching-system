import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { useMe } from "../../auth/hooks/useMe"

interface ApprovalGateProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ApprovalGate({ children, fallback }: ApprovalGateProps) {
  const { data: me, isLoading } = useMe()

  if (isLoading) {
    return <span>로딩 중...</span>
  }

  const isApproved = me?.businessApprovalState === "approved"

  if (!isApproved) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div
        style={{
          padding: "1rem",
          backgroundColor: "#fef3c7",
          border: "1px solid #f59e0b",
          borderRadius: "0.375rem",
        }}
      >
        <p style={{ margin: 0, fontWeight: 500 }}>사업자 승인 필요</p>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem" }}>
          의뢰를 등록하려면 사업자 정보 승인이 필요합니다.
        </p>
        <Link
          to="/business-profile"
          style={{
            display: "inline-block",
            marginTop: "0.75rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#f59e0b",
            color: "white",
            textDecoration: "none",
            borderRadius: "0.25rem",
            fontSize: "0.875rem",
          }}
        >
          사업자 정보 등록하기 →
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
