import { render, screen } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import App from "./App"

describe("admin-site app", () => {
  it("renders foundation heading", () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    )

    expect(screen.getByRole("heading", { name: "Admin Site Foundation" })).toBeInTheDocument()
  })
})
