import { Link, Navigate, Route, Routes } from "react-router-dom"
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute"
import { LoginPage } from "./features/auth/pages/LoginPage"
import { SignupPage } from "./features/auth/pages/SignupPage"
import { useAuthStore } from "./features/auth/store/auth-store"
import { BusinessProfilePage, RequesterApprovalRoute } from "./features/business-profile"
import { SupplierSearchPage, SupplierDetailPage } from "./features/discovery"
import { SupplierProfilePage, SupplierRoute } from "./features/supplier-profile"

function HomePage() {
  return (
    <section>
      <h1>Main Site Foundation</h1>
      <p>Task 02 auth skeleton is active for main-site.</p>
    </section>
  )
}

function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  return (
    <section>
      <h1>Authenticated Dashboard</h1>
      <p>{user ? `${user.email} (${user.role})` : "No user loaded"}</p>
      <button onClick={clearAuth}>Logout</button>
    </section>
  )
}

function NewRequestPage() {
  return (
    <section>
      <h1>새 의뢰 등록</h1>
      <p>의뢰 생성 폼이 여기에 표시됩니다. (Task 06에서 구현 예정)</p>
    </section>
  )
}

export default function App() {
  return (
    <main style={{ padding: "2rem", fontFamily: '"Noto Sans JP", sans-serif' }}>
      <nav style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/signup">Signup</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/business-profile">Business Profile</Link>
        <Link to="/supplier/profile">Supplier Profile</Link>
        <Link to="/suppliers">Suppliers</Link>
        <Link to="/requests/new">New Request</Link>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers"
          element={<SupplierSearchPage />}
        />
        <Route
          path="/suppliers/:supplierId"
          element={<SupplierDetailPage />}
        />
        <Route
          path="/supplier/profile"
          element={
            <SupplierRoute>
              <SupplierProfilePage />
            </SupplierRoute>
          }
        />
        <Route
          path="/business-profile"
          element={
            <ProtectedRoute>
              <BusinessProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests/new"
          element={
            <RequesterApprovalRoute>
              <NewRequestPage />
            </RequesterApprovalRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  )
}
