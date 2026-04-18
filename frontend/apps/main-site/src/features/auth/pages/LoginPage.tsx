import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useLogin } from "../hooks/useLogin"

export function LoginPage() {
  const { t } = useTranslation("auth")
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

          {loginMutation.isError && (
            <div role="alert" className="font-medium" style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-sm)",
              background: "var(--danger-soft)",
              color: "var(--danger)",
              fontSize: "0.875rem",
            }}>
              {t("login.errorMessage")}
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
