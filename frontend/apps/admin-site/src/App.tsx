import { Link, Navigate, Route, Routes } from "react-router-dom"
import { ProtectedAdminRoute } from "./features/auth/components/ProtectedAdminRoute"
import { LoginPage } from "./features/auth/pages/LoginPage"
import { ReviewQueuePage } from "./features/reviews/pages/ReviewQueuePage"
import { ReviewDetailPage } from "./features/reviews/pages/ReviewDetailPage"

function HomePage() {
  return (
    <section>
      <h1>Admin Review Workspace</h1>
      <p>Task 05 검수 큐와 검수 결정 작업 공간입니다.</p>
    </section>
  )
}

export default function App() {
  return (
    <main style={{ padding: "2rem", fontFamily: '"Noto Sans JP", sans-serif' }}>
      <nav style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/reviews">Review Queue</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/reviews"
          element={
            <ProtectedAdminRoute>
              <ReviewQueuePage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/reviews/:reviewId"
          element={
            <ProtectedAdminRoute>
              <ReviewDetailPage />
            </ProtectedAdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  )
}
