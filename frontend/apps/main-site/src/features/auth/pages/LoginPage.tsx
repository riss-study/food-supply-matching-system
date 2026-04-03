import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useLogin } from "../hooks/useLogin"

export function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await loginMutation.mutateAsync({ email, password })
    navigate("/dashboard")
  }

  return (
    <div className="auth-layout">
      <div className="auth-layout-left">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>잇다</div>
          <h1>식품 제조 매칭의<br />새로운 기준</h1>
          <p style={{ marginTop: 12 }}>
            공급자 탐색부터 견적 비교, 상담까지 하나의 플랫폼에서 식품 제조 파트너를 만나보세요.
          </p>
          <div style={{
            marginTop: 40,
            width: "100%",
            maxWidth: 320,
            height: 180,
            background: "rgba(255,255,255,0.08)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.3)",
            fontSize: "0.85rem"
          }}>
            Food Factory Image
          </div>
        </div>
      </div>
      <div className="auth-layout-right">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>로그인</h2>
          <p className="text-muted" style={{ marginTop: -12 }}>계정에 로그인하여 서비스를 이용하세요.</p>

          {loginMutation.isError && (
            <div role="alert" style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-sm)",
              background: "var(--danger-soft)",
              color: "var(--danger)",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}>
              로그인에 실패했습니다. 이메일과 비밀번호를 다시 확인해 주세요.
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
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loginMutation.isPending || !email || !password}
          >
            로그인
          </button>

          <p className="auth-helper-text text-center">
            계정이 없으신가요? <Link to="/signup">회원가입</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
