import type { UserRole } from "@fsm/types"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useSignup } from "../hooks/useSignup"

export function SignupPage() {
  const navigate = useNavigate()
  const signupMutation = useSignup()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [role, setRole] = useState<UserRole>("requester")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await signupMutation.mutateAsync({ email, password, role, businessName })
    navigate("/login")
  }

  return (
    <div className="auth-layout">
      <div className="auth-layout-left">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>잇다</div>
          <h1>식품 B2B 매칭 플랫폼에<br />가입하세요</h1>
          <div className="signup-role-guide" style={{ marginTop: 24, flexDirection: "row", gap: 12 }}>
            <div
              className={`signup-role-card ${role === "requester" ? "is-active" : ""}`}
              onClick={() => setRole("requester")}
              style={{ flex: 1 }}
            >
              <div style={{ fontSize: "1.25rem", marginBottom: 8, opacity: 0.7 }}>&#x1F50D;</div>
              <strong>요청자</strong>
              <p>식품 제조를 의뢰하고<br />최적의 공급자를 찾아보세요</p>
            </div>
            <div
              className={`signup-role-card ${role === "supplier" ? "is-active" : ""}`}
              onClick={() => setRole("supplier")}
              style={{ flex: 1 }}
            >
              <div style={{ fontSize: "1.25rem", marginBottom: 8, opacity: 0.7 }}>&#x1F3ED;</div>
              <strong>공급자</strong>
              <p>제조 역량을 등록하고<br />새로운 의뢰를 받아보세요</p>
            </div>
          </div>
        </div>
      </div>
      <div className="auth-layout-right">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>회원가입</h2>
          <p className="text-muted" style={{ marginTop: -12 }}>아래 정보를 입력하여 가입하세요.</p>

          {signupMutation.isError && (
            <div role="alert" style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-sm)",
              background: "var(--danger-soft)",
              color: "var(--danger)",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}>
              회원가입에 실패했습니다. 입력값을 다시 확인해 주세요.
            </div>
          )}

          <div className="input-field">
            <label>이메일</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
            />
          </div>

          <div className="input-field">
            <label>비밀번호</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="영문+숫자+특수문자 포함 8자 이상"
            />
          </div>

          <div className="input-field">
            <label>회사명</label>
            <input
              type="text"
              className="input"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder="회사명을 입력해주세요 (2~100자)"
            />
          </div>

          <div className="input-field">
            <label>역할</label>
            <select
              className="select"
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
            >
              <option value="requester">요청자</option>
              <option value="supplier">공급자</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={signupMutation.isPending || !email || !password || !businessName}
          >
            회원가입
          </button>

          <p className="auth-helper-text text-center">
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
