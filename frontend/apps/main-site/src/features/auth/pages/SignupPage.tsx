import type { UserRole } from "@fsm/types"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useSignup } from "../hooks/useSignup"

export function SignupPage() {
  const { t } = useTranslation("auth")
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
          <div className="mb-24" style={{ fontSize: 28, fontWeight: 800 }}>{t("brand")}</div>
          <h1>{t("signup.heroTitleLine1")}<br />{t("signup.heroTitleLine2")}</h1>
          <div className="signup-role-guide mt-24 gap-12" style={{ flexDirection: "row" }}>
            <div
              className={`signup-role-card flex-1 ${role === "requester" ? "is-active" : ""}`}
              onClick={() => setRole("requester")}
            >
              <div className="mb-8" style={{ fontSize: "1.25rem", opacity: 0.7 }}>&#x1F50D;</div>
              <strong>{t("signup.roleRequesterLabel")}</strong>
              <p>{t("signup.roleRequesterDesc1")}<br />{t("signup.roleRequesterDesc2")}</p>
            </div>
            <div
              className={`signup-role-card flex-1 ${role === "supplier" ? "is-active" : ""}`}
              onClick={() => setRole("supplier")}
            >
              <div className="mb-8" style={{ fontSize: "1.25rem", opacity: 0.7 }}>&#x1F3ED;</div>
              <strong>{t("signup.roleSupplierLabel")}</strong>
              <p>{t("signup.roleSupplierDesc1")}<br />{t("signup.roleSupplierDesc2")}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="auth-layout-right">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>{t("signup.title")}</h2>
          <p className="text-muted" style={{ marginTop: -12 }}>{t("signup.subtitle")}</p>

          {signupMutation.isError && (
            <div role="alert" className="font-medium" style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-sm)",
              background: "var(--danger-soft)",
              color: "var(--danger)",
              fontSize: "0.875rem",
            }}>
              {t("signup.errorMessage")}
            </div>
          )}

          <div className="input-field">
            <label>{t("signup.emailLabel")}</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("signup.emailPlaceholder")}
            />
          </div>

          <div className="input-field">
            <label>{t("signup.passwordLabel")}</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("signup.passwordPlaceholder")}
            />
          </div>

          <div className="input-field">
            <label>{t("signup.businessNameLabel")}</label>
            <input
              type="text"
              className="input"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder={t("signup.businessNamePlaceholder")}
            />
          </div>

          <div className="input-field">
            <label>{t("signup.roleLabel")}</label>
            <select
              className="select"
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
            >
              <option value="requester">{t("signup.roleRequesterOption")}</option>
              <option value="supplier">{t("signup.roleSupplierOption")}</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={signupMutation.isPending || !email || !password || !businessName}
          >
            {t("signup.submit")}
          </button>

          <p className="auth-helper-text text-center">
            {t("signup.haveAccount")} <Link to="/login">{t("signup.loginLink")}</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
