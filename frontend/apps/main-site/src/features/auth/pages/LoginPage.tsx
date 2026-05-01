import { useState } from "react"
import axios from "axios"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useLogin } from "../hooks/useLogin"

/**
 * 로그인 실패 응답을 사용자 메시지로 변환.
 *
 * 백엔드 분기 (이미 다양화됨):
 *   - 401 (4011): InvalidCredentials → 자격증명 불일치
 *   - 429 (4290): LoginRateLimit → "Too many login attempts; retry in Ns"
 *   - 400        : Validation → 입력 형식 오류
 *   - 5xx        : 서버 오류
 *   - network    : 응답 없음 (CORS/오프라인)
 */
function deriveLoginErrorKey(error: unknown, t: (k: string, opts?: Record<string, unknown>) => string): string {
  if (!axios.isAxiosError(error)) return t("login.errorMessage")
  if (!error.response) return t("login.errorNetwork")
  const status = error.response.status
  if (status === 401) return t("login.errorInvalidCredentials")
  if (status === 429) {
    const message = (error.response.data as { message?: string } | undefined)?.message ?? ""
    const m = message.match(/retry in (\d+)s/)
    if (m) return t("login.errorTooManyAttempts", { seconds: m[1] })
    return t("login.errorTooManyAttemptsGeneric")
  }
  if (status === 400) return t("login.errorBadRequest")
  if (status >= 500) return t("login.errorServer")
  return t("login.errorMessage")
}

export function LoginPage() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await loginMutation.mutateAsync({ email, password })
      navigate("/")
    } catch {
      // 메시지는 mutation.error 에서 derive — 화면에 isError 로 표시.
      // throw 하지 않아 unhandled rejection 경고 회피.
    }
  }

  const errorMessage = loginMutation.isError ? deriveLoginErrorKey(loginMutation.error, t) : null

  return (
    <div className="auth-layout">
      <div className="auth-layout-left">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="mb-24" style={{ fontSize: 28, fontWeight: 800 }}>{t("brand")}</div>
          <h1>{t("login.heroTitleLine1")}<br />{t("login.heroTitleLine2")}</h1>
          <p className="mt-12">
            {t("login.heroDesc")}
          </p>
          <div className="w-full flex items-center justify-center" style={{
            marginTop: 40,
            maxWidth: 320,
            height: 180,
            background: "rgba(255,255,255,0.08)",
            borderRadius: "var(--radius-lg)",
            color: "rgba(255,255,255,0.3)",
            fontSize: "0.85rem"
          }}>
            {t("login.imagePlaceholder")}
          </div>
        </div>
      </div>
      <div className="auth-layout-right">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>{t("login.title")}</h2>
          <p className="text-muted" style={{ marginTop: -12 }}>{t("login.subtitle")}</p>

          {errorMessage && (
            <div role="alert" className="font-medium" style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-sm)",
              background: "var(--danger-soft)",
              color: "var(--danger)",
              fontSize: "0.875rem",
            }}>
              {errorMessage}
            </div>
          )}

          <div className="input-field">
            <label>{t("login.emailLabel")}</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("login.emailPlaceholder")}
            />
          </div>

          <div className="input-field">
            <label>{t("login.passwordLabel")}</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("login.passwordPlaceholder")}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loginMutation.isPending || !email || !password}
          >
            {t("login.submit")}
          </button>

          <p className="auth-helper-text text-center">
            {t("login.noAccount")} <Link to="/signup">{t("login.signupLink")}</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
