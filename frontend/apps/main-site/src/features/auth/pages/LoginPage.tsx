import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useLogin } from "../hooks/useLogin"

export function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const [email, setEmail] = useState("user@example.com")
  const [password, setPassword] = useState("SecurePass123!")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await loginMutation.mutateAsync({ email, password })
    navigate("/dashboard")
  }

  return (
    <section>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <button type="submit" disabled={loginMutation.isPending}>Login</button>
      </form>
      {loginMutation.isError ? <p role="alert">Login failed</p> : null}
    </section>
  )
}
