import { Link, Route, Routes } from "react-router-dom"

function HomePage() {
  return (
    <section>
      <h1>Admin Site Foundation</h1>
      <p>Task 01 foundation route for admin-site.</p>
    </section>
  )
}

function StatusPage() {
  return <p>Current route prefix: /admin</p>
}

export default function App() {
  return (
    <main style={{ padding: "2rem", fontFamily: "\"Noto Sans JP\", sans-serif" }}>
      <nav style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <Link to="/">Home</Link>
        <Link to="/status">Status</Link>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/status" element={<StatusPage />} />
      </Routes>
    </main>
  )
}
