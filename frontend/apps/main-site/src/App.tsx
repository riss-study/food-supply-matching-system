import { useState, useRef, useEffect } from "react"
import { Link, Navigate, Route, Routes } from "react-router-dom"
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute"
import { LoginPage } from "./features/auth/pages/LoginPage"
import { SignupPage } from "./features/auth/pages/SignupPage"
import { useAuthStore } from "./features/auth/store/auth-store"
import { BusinessProfilePage, RequesterApprovalRoute } from "./features/business-profile"
import { SupplierSearchPage, SupplierDetailPage } from "./features/discovery"
import { QuoteComparisonPage } from "./features/quotes"
import { SupplierProfilePage, SupplierRoute } from "./features/supplier-profile"
import { RequestListPage, RequestCreatePage, RequestDetailPage } from "./features/request-management"
import { SupplierRequestFeedPage, SupplierRequestDetailPage } from "./features/supplier-requests"
import { QuoteCreatePage, SupplierQuoteListPage } from "./features/supplier-quotes"
import { ThreadListPage, ThreadDetailPage } from "./features/threads"
import { NoticeListDetailPage } from "./features/notices"

type NavItem = {
  to: string
  label: string
}

function HomePage() {
  return (
    <div className="home-page">
      {/* Hero Banner */}
      <section className="home-hero">
        <span className="home-hero-label">B2B 식품 제조 매칭 플랫폼</span>
        <h1 className="home-hero-title">
          믿을 수 있는 식품 제조 파트너를<br />지금 만나보세요
        </h1>
        <p className="home-hero-desc">
          HACCP, ISO 인증 제조사부터 OEM/ODM 전문 업체까지.<br />
          검증된 공급자 네트워크에서 최적의 파트너를 찾으세요.
        </p>
        <div className="flex gap-12 justify-center">
          <Link to="/suppliers" className="btn btn-primary">공급자 탐색</Link>
          <Link to="/requests/new" className="btn btn-secondary" style={{ background: "rgba(255,255,255,0.15)", color: "var(--inverse-fg)", borderColor: "rgba(255,255,255,0.25)" }}>의뢰 등록</Link>
        </div>
      </section>

      {/* 핵심 기능 */}
      <section className="home-section">
        <h2 className="home-section-title">핵심 기능</h2>
        <div className="card-grid">
          <div className="surface">
            <div className="home-feature-icon">&#x1F50D;</div>
            <h3 className="font-bold mb-4">공급자 탐색</h3>
            <p className="text-muted text-sm">카테고리, 지역, 생산능력 등 다양한 조건으로 검증된 식품 제조사를 검색하세요.</p>
          </div>
          <div className="surface">
            <div className="home-feature-icon">&#x1F4CB;</div>
            <h3 className="font-bold mb-4">의뢰 관리</h3>
            <p className="text-muted text-sm">식품 제조 의뢰를 등록하고 견적을 비교하여 최적의 파트너를 선택하세요.</p>
          </div>
          <div className="surface">
            <div className="home-feature-icon">&#x1F4AC;</div>
            <h3 className="font-bold mb-4">실시간 소통</h3>
            <p className="text-muted text-sm">공급자와 직접 메시지를 주고받으며 상세 조건을 조율할 수 있습니다.</p>
          </div>
        </div>
      </section>

      {/* 바로가기 */}
      <section className="home-section">
        <h2 className="home-section-title" style={{ textAlign: "left" }}>바로가기</h2>
        <div className="card-grid">
          <Link to="/suppliers" className="surface home-shortcut">
            <div className="home-feature-icon">&#x1F50D;</div>
            <h3 className="font-bold mb-4">공급자 탐색</h3>
            <p className="text-muted text-sm mb-12">검증된 식품 제조사 검색</p>
            <span className="text-accent text-sm font-medium">탐색하기 →</span>
          </Link>
          <Link to="/requests/new" className="surface home-shortcut">
            <div className="home-feature-icon">&#x2795;</div>
            <h3 className="font-bold mb-4">의뢰 등록</h3>
            <p className="text-muted text-sm mb-12">새로운 제조 의뢰 작성</p>
            <span className="text-accent text-sm font-medium">등록하기 →</span>
          </Link>
          <Link to="/requests" className="surface home-shortcut">
            <div className="home-feature-icon">&#x2630;</div>
            <h3 className="font-bold mb-4">내 의뢰</h3>
            <p className="text-muted text-sm mb-12">의뢰 현황과 견적 관리</p>
            <span className="text-accent text-sm font-medium">확인하기 →</span>
          </Link>
        </div>
      </section>
    </div>
  )
}

function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const roleLabel = user?.role === "supplier" ? "공급자" : user?.role === "requester" ? "요청자" : "사용자"
  const guideText =
    user?.role === "supplier"
      ? "의뢰 피드, 내 견적, 메시지 화면으로 이동해 다음 작업을 이어가세요."
      : "공급자 탐색, 내 의뢰, 메시지 화면으로 이동해 다음 작업을 이어가세요."

  return (
    <div className="page" style={{ padding: "32px 0" }}>
      <div className="surface" style={{ padding: 32 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 8 }}>{roleLabel} 시작 화면</h1>
        <p className="text-muted mb-4">{user ? `${user.email} 계정으로 로그인되어 있습니다.` : "사용자 정보를 불러오지 못했습니다."}</p>
        <p className="text-muted mb-16">{guideText}</p>
        <div>
          <button type="button" className="btn btn-secondary" onClick={clearAuth}>로그아웃</button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const publicNav: NavItem[] = [
    { to: "/", label: "홈" },
    { to: "/suppliers", label: "공급자 탐색" },
    { to: "/notices", label: "공지사항" },
  ]

  const requesterNav: NavItem[] = [
    { to: "/requests", label: "내 의뢰" },
    { to: "/threads", label: "메시지" },
  ]

  const supplierNav: NavItem[] = [
    { to: "/supplier/requests", label: "의뢰 피드" },
    { to: "/supplier/quotes", label: "내 견적" },
    { to: "/threads", label: "메시지" },
  ]

  const activeNav = user?.role === "requester" ? requesterNav : user?.role === "supplier" ? supplierNav : []

  return (
    <div className="main-shell">
      <header className="main-header">
        <Link to="/" className="main-header-brand">잇다</Link>
        <nav className="main-header-nav">
          {publicNav.map((item) => (
            <Link key={item.to} to={item.to}>{item.label}</Link>
          ))}
          {activeNav.map((item) => (
            <Link key={item.to} to={item.to}>{item.label}</Link>
          ))}
          {!user && (
            <>
              <Link to="/login">로그인</Link>
              <Link to="/signup">회원가입</Link>
            </>
          )}
        </nav>
        <div className="main-header-actions">
          {user ? (
            <div className="main-header-user-wrap" ref={userMenuRef}>
              <div className="main-header-user" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <div className="main-header-avatar" />
                <span className="main-header-username">{user.email?.split("@")[0] ?? "사용자"}</span>
                <span className="main-header-chevron">&#x2304;</span>
              </div>
              {userMenuOpen && (
                <div className="user-dropdown">
                  <Link to="/business-profile" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    내 프로필
                  </Link>
                  <button type="button" className="user-dropdown-item" onClick={() => { clearAuth(); setUserMenuOpen(false); }}>
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="메뉴"
        >
          {mobileMenuOpen ? "\u2715" : "\u2630"}
        </button>
      </header>

      {/* Mobile Nav Overlay */}
      {mobileMenuOpen && (
        <>
          <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)} />
          <nav className="mobile-nav">
            {publicNav.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}>{item.label}</Link>
            ))}
            {activeNav.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}>{item.label}</Link>
            ))}
            {user ? (
              <>
                <Link to="/business-profile" onClick={() => setMobileMenuOpen(false)}>내 프로필</Link>
                <button type="button" className="mobile-nav-logout" onClick={() => { clearAuth(); setMobileMenuOpen(false); }}>로그아웃</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>로그인</Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>회원가입</Link>
              </>
            )}
          </nav>
        </>
      )}
      <main className="main-content">
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
            path="/requests/:requestId/quotes"
            element={
              <ProtectedRoute>
                <QuoteComparisonPage />
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
          <Route
            path="/quotes/create"
            element={
              <SupplierRoute>
                <QuoteCreatePage />
              </SupplierRoute>
            }
          />
          <Route
            path="/supplier/quotes"
            element={
              <SupplierRoute>
                <SupplierQuoteListPage />
              </SupplierRoute>
            }
          />
          <Route
            path="/threads"
            element={
              <ProtectedRoute>
                <ThreadListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/threads/:threadId"
            element={
              <ProtectedRoute>
                <ThreadDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notices"
            element={<NoticeListDetailPage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
