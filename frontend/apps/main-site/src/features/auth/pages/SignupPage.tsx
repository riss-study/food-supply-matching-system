import type { UserRole } from "@fsm/types"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSignup } from "../hooks/useSignup"

export function SignupPage() {
  const navigate = useNavigate()
  const signupMutation = useSignup()
  const [email, setEmail] = useState("new@example.com")
  const [password, setPassword] = useState("SecurePass123!")
  const [businessName, setBusinessName] = useState("Example Foods")
  const [role, setRole] = useState<UserRole>("requester")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await signupMutation.mutateAsync({ email, password, role, businessName })
    navigate("/login")
  }

  return (
    <section>
      <h1>Signup</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <label>
          Business Name
          <input value={businessName} onChange={(event) => setBusinessName(event.target.value)} />
        </label>
        <label>
          Role
          <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
            <option value="requester">Requester</option>
            <option value="supplier">Supplier</option>
          </select>
        </label>
        <button type="submit" disabled={signupMutation.isPending}>Signup</button>
      </form>
      {signupMutation.isError ? <p role="alert">Signup failed</p> : null}
    </section>
  )
}
