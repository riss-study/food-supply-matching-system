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
      <div className="alert-warning">
        <div>
          <p className="font-medium" style={{ margin: 0 }}>사업자 승인 필요</p>
          <p className="text-base" style={{ margin: "8px 0 0" }}>
            의뢰를 등록하려면 사업자 정보 승인이 필요합니다.
          </p>
          <Link
            to="/business-profile"
            className="btn btn-sm btn-warning mt-12"
          >
            사업자 정보 등록하기 →
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
