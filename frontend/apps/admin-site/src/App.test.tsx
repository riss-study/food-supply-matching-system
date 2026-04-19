import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import App from "./App"
import { useAdminAuthStore } from "./features/auth/store/admin-auth-store"

describe("admin-site app", () => {
  it("redirects to login when not authenticated", () => {
    useAdminAuthStore.setState({ accessToken: null, user: null })

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={["/"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText("관리자 로그인")).toBeInTheDocument()
  })
})
