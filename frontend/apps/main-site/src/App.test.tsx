import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import App from "./App"
import { useAuthStore } from "./features/auth/store/auth-store"

function renderWithProviders(initialEntries: string[]) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("main-site auth skeleton", () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it("redirects unauthenticated dashboard access to login page", () => {
    renderWithProviders(["/dashboard"])

    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument()
  })

  it("renders dashboard for authenticated user", () => {
    useAuthStore.getState().setAuth({
      accessToken: "token",
      refreshToken: "refresh",
      user: { userId: "usr_test", email: "user@example.com", role: "requester" },
    })

    renderWithProviders(["/dashboard"])

    expect(screen.getByRole("heading", { name: "Authenticated Dashboard" })).toBeInTheDocument()
  })
})
