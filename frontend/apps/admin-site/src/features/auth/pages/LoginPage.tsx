import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation, Trans } from "react-i18next"
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
    navigate("/reviews")
  }

  return (
    <div className="login-split">
      <div className="login-brand-panel">
        <div>
          <h1 className="font-bold mb-8" style={{ fontSize: 26, letterSpacing: -0.5 }}>{t("brandTitle")}</h1>
          <p className="font-medium text-accent" style={{ fontSize: 11, letterSpacing: 2, marginBottom: 28 }}>{t("brandSubtitle")}</p>
          <p className="text-lg text-muted" style={{ lineHeight: 1.6 }}>
            <Trans i18nKey="brandDescription" ns="auth" components={{ br: <br /> }} />
          </p>
        </div>
        <div className="login-brand-image">
          {t("brandImagePlaceholder")}
        </div>
        <p className="text-accent" style={{ fontSize: 13 }}>
          {t("brandFeatures")}
        </p>
      </div>

      <div className="login-form-panel">
        <div className="login-form-wrapper">
          <h2 className="login-form-title">{t("loginTitle")}</h2>
          <p className="login-form-subtitle">{t("loginSubtitle")}</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-field">
              <label htmlFor="email">{t("emailLabel")}</label>
              <input
                id="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
              />
            </div>
            <div className="input-field">
              <label htmlFor="password">{t("passwordLabel")}</label>
              <input
                id="password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loginMutation.isPending || !email || !password}>
              {t("loginButton")}
            </button>
          </form>

          {loginMutation.isError ? <p className="login-error" role="alert">{t("loginError")}</p> : null}
        </div>
      </div>
    </div>
  )
}
