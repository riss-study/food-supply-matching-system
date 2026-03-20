import { Link, Navigate, Route, Routes } from "react-router-dom"
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute"
import { LoginPage } from "./features/auth/pages/LoginPage"
import { SignupPage } from "./features/auth/pages/SignupPage"
import { useAuthStore } from "./features/auth/store/auth-store"
import { BusinessProfilePage, RequesterApprovalRoute } from "./features/business-profile"
import { SupplierSearchPage, SupplierDetailPage } from "./features/discovery"
import { SupplierProfilePage, SupplierRoute } from "./features/supplier-profile"
import { RequestListPage, RequestCreatePage, RequestDetailPage } from "./features/request-management"
import { SupplierRequestFeedPage, SupplierRequestDetailPage } from "./features/supplier-requests"

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

export default function App() {
  return (
    <main style={{ padding: "2rem", fontFamily: '"Noto Sans JP", sans-serif' }}>
      <nav style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/signup">Signup</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/business-profile">Business Profile</Link>
        <Link to="/supplier/profile">Supplier Profile</Link>
        <Link to="/suppliers">Suppliers</Link>
        <Link to="/requests">My Requests</Link>
        <Link to="/requests/new">New Request</Link>
        <Link to="/supplier/requests">Request Feed</Link>
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
          path="/requests"
          element={
            <ProtectedRoute>
              <RequestListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests/new"
          element={
            <RequesterApprovalRoute>
              <RequestCreatePage />
            </RequesterApprovalRoute>
          }
        />
        <Route
          path="/requests/:requestId"
          element={
            <ProtectedRoute>
              <RequestDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supplier/requests"
          element={
            <SupplierRoute>
              <SupplierRequestFeedPage />
            </SupplierRoute>
          }
        />
        <Route
          path="/supplier/requests/:requestId"
          element={
            <SupplierRoute>
              <SupplierRequestDetailPage />
            </SupplierRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  )
}
