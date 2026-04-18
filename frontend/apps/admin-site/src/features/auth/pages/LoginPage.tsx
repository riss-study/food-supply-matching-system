import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useLogin } from "../hooks/useLogin"

export function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await loginMutation.mutateAsync({ email, password })
    navigate("/reviews")
  }

  return (
    <div className="login-split">
      <div className="login-brand-panel">
        <div>
          <h1 className="font-bold mb-8" style={{ fontSize: 26, letterSpacing: -0.5 }}>잇다</h1>
          <p className="font-medium text-accent" style={{ fontSize: 11, letterSpacing: 2, marginBottom: 28 }}>Admin Console</p>
          <p className="text-lg text-muted" style={{ lineHeight: 1.6 }}>
            식품 제조 매칭의 모든 것을<br />한 곳에서 관리하세요.
          </p>
        </div>
        <div className="login-brand-image">
          Factory Image
        </div>
        <p className="text-accent" style={{ fontSize: 13 }}>
          공급자 검수 · 공지사항 · 통계 대시보드
        </p>
      </div>

      <div className="login-form-panel">
        <div className="login-form-wrapper">
          <h2 className="login-form-title">관리자 로그인</h2>
          <p className="login-form-subtitle">관리자 계정으로 로그인해주세요</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-field">
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@itda.co.kr"
              />
            </div>
            <div className="input-field">
              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loginMutation.isPending || !email || !password}>
              로그인
            </button>
          </form>

          {loginMutation.isError ? <p className="login-error" role="alert">로그인에 실패했습니다.</p> : null}
        </div>
      </div>
    </div>
  )
}
