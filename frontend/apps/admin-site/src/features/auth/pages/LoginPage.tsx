import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useLogin } from "../hooks/useLogin"

export function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const [email, setEmail] = useState("admin@example.com")
  const [password, setPassword] = useState("SecurePass123!")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await loginMutation.mutateAsync({ email, password })
    navigate("/reviews")
  }

  return (
    <section>
      <h1>Admin Login</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", maxWidth: "360px" }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit" disabled={loginMutation.isPending}>Login</button>
      </form>
      {loginMutation.isError ? <p role="alert">Login failed</p> : null}
    </section>
  )
}
