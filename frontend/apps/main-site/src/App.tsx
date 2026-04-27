import { useState, useRef, useEffect } from "react"
import { Link, Navigate, Route, Routes } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute"
import { LoginPage } from "./features/auth/pages/LoginPage"
import { SignupPage } from "./features/auth/pages/SignupPage"
import { useAuthStore } from "./features/auth/store/auth-store"
import { useNotificationStream } from "./features/notifications/hooks/useNotificationStream"
import { ToastContainer } from "./features/notifications/components/ToastContainer"
import { useNotificationStore, selectTotalUnread } from "./features/notifications/store/notification-store"
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
  const { t } = useTranslation("app")
  return (
    <div className="home-page">
      {/* Hero Banner */}
      <section className="home-hero">
        <span className="home-hero-label">{t("home.heroLabel")}</span>
        <h1 className="home-hero-title">
          {t("home.heroTitleLine1")}<br />{t("home.heroTitleLine2")}
        </h1>
        <p className="home-hero-desc">
          {t("home.heroDescLine1")}<br />
          {t("home.heroDescLine2")}
        </p>
        <div className="flex gap-12 justify-center">
          <Link to="/suppliers" className="btn btn-primary">{t("home.ctaExplore")}</Link>
          <Link to="/requests/new" className="btn btn-secondary" style={{ background: "rgba(255,255,255,0.15)", color: "var(--inverse-fg)", borderColor: "rgba(255,255,255,0.25)" }}>{t("home.ctaCreateRequest")}</Link>
        </div>
      </section>

      {/* 핵심 기능 */}
      <section className="home-section">
        <h2 className="home-section-title">{t("home.featureSectionTitle")}</h2>
        <div className="card-grid">
          <div className="surface">
            <div className="home-feature-icon">&#x1F50D;</div>
            <h3 className="font-bold mb-4">{t("home.featureDiscoveryTitle")}</h3>
            <p className="text-muted text-sm">{t("home.featureDiscoveryDesc")}</p>
          </div>
          <div className="surface">
            <div className="home-feature-icon">&#x1F4CB;</div>
            <h3 className="font-bold mb-4">{t("home.featureRequestTitle")}</h3>
            <p className="text-muted text-sm">{t("home.featureRequestDesc")}</p>
          </div>
          <div className="surface">
            <div className="home-feature-icon">&#x1F4AC;</div>
            <h3 className="font-bold mb-4">{t("home.featureCommunicationTitle")}</h3>
            <p className="text-muted text-sm">{t("home.featureCommunicationDesc")}</p>
          </div>
        </div>
      </section>

      {/* 바로가기 */}
      <section className="home-section">
        <h2 className="home-section-title" style={{ textAlign: "left" }}>{t("home.shortcutSectionTitle")}</h2>
        <div className="card-grid">
          <Link to="/suppliers" className="surface home-shortcut">
            <div className="home-feature-icon">&#x1F50D;</div>
            <h3 className="font-bold mb-4">{t("home.shortcutExploreTitle")}</h3>
            <p className="text-muted text-sm mb-12">{t("home.shortcutExploreDesc")}</p>
            <span className="text-accent text-sm font-medium">{t("home.shortcutExploreAction")}</span>
          </Link>
          <Link to="/requests/new" className="surface home-shortcut">
            <div className="home-feature-icon">&#x2795;</div>
            <h3 className="font-bold mb-4">{t("home.shortcutCreateRequestTitle")}</h3>
            <p className="text-muted text-sm mb-12">{t("home.shortcutCreateRequestDesc")}</p>
            <span className="text-accent text-sm font-medium">{t("home.shortcutCreateRequestAction")}</span>
          </Link>
          <Link to="/requests" className="surface home-shortcut">
            <div className="home-feature-icon">&#x2630;</div>
            <h3 className="font-bold mb-4">{t("home.shortcutMyRequestsTitle")}</h3>
            <p className="text-muted text-sm mb-12">{t("home.shortcutMyRequestsDesc")}</p>
            <span className="text-accent text-sm font-medium">{t("home.shortcutMyRequestsAction")}</span>
          </Link>
        </div>
      </section>
    </div>
  )
}

function DashboardPage() {
  const { t } = useTranslation("app")
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const roleLabel = user?.role === "supplier" ? t("role.supplier") : user?.role === "requester" ? t("role.requester") : t("role.default")
  const guideText =
    user?.role === "supplier"
      ? t("dashboard.guideSupplier")
      : t("dashboard.guideRequester")

  return (
    <div className="page" style={{ padding: "32px 0" }}>
      <div className="surface" style={{ padding: 32 }}>
        <h1 className="font-bold mb-8" style={{ fontSize: "1.5rem" }}>{roleLabel} {t("dashboard.titleSuffix")}</h1>
        <p className="text-muted mb-4">{user ? t("dashboard.loggedInAs", { email: user.email }) : t("dashboard.noUserInfo")}</p>
        <p className="text-muted mb-16">{guideText}</p>
        <div>
          <button type="button" className="btn btn-secondary" onClick={clearAuth}>{t("common:logout")}</button>
        </div>
      </div>
    </div>
  )
}

/**
 * "메시지" nav Link + 글로벌 unread count 뱃지.
 * NotificationStream 으로 누적되는 unread 합산이 0보다 크면 표시.
 */
function MessagesNavLink({ to, label }: { to: string; label: string }) {
  const totalUnread = useNotificationStore(selectTotalUnread)
  return (
    <Link to={to} style={{ position: "relative" }}>
      {label}
      {totalUnread > 0 && (
        <span
          aria-label={`읽지 않은 메시지 ${totalUnread}건`}
          style={{
            marginLeft: 6,
            display: "inline-block",
            background: "var(--danger, #dc2626)",
            color: "#fff",
            borderRadius: 10,
            padding: "0 6px",
            fontSize: 11,
            fontWeight: 600,
            minWidth: 18,
            textAlign: "center",
            lineHeight: "18px",
          }}
        >
          {totalUnread > 99 ? "99+" : totalUnread}
        </span>
      )}
    </Link>
  )
}

export default function App() {
  const { t } = useTranslation("app")
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // 로그인 사용자만 글로벌 알림 stream 활성화. hook 내부에서 단락 처리.
  useNotificationStream()

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
    { to: "/", label: t("nav.home") },
    { to: "/suppliers", label: t("nav.supplierSearch") },
    { to: "/notices", label: t("nav.notices") },
  ]

  const requesterNav: NavItem[] = [
    { to: "/requests", label: t("nav.myRequests") },
    { to: "/threads", label: t("nav.messages") },
  ]

  const supplierNav: NavItem[] = [
    { to: "/supplier/requests", label: t("nav.supplierRequestFeed") },
    { to: "/supplier/quotes", label: t("nav.supplierQuotes") },
    { to: "/threads", label: t("nav.messages") },
  ]

  const activeNav = user?.role === "requester" ? requesterNav : user?.role === "supplier" ? supplierNav : []

  return (
    <div className="main-shell">
      <header className="main-header">
        <Link to="/" className="main-header-brand">{t("brand")}</Link>
        <nav className="main-header-nav">
          {publicNav.map((item) => (
            <Link key={item.to} to={item.to}>{item.label}</Link>
          ))}
          {activeNav.map((item) =>
            item.to === "/threads" ? (
              <MessagesNavLink key={item.to} to={item.to} label={item.label} />
            ) : (
              <Link key={item.to} to={item.to}>{item.label}</Link>
            ),
          )}
          {!user && (
            <>
              <Link to="/login">{t("nav.login")}</Link>
              <Link to="/signup">{t("nav.signup")}</Link>
            </>
          )}
        </nav>
        <div className="main-header-actions">
          {user ? (
            <div className="main-header-user-wrap" ref={userMenuRef}>
              <div className="main-header-user" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <div className="main-header-avatar" />
                <span className="main-header-username">{user.email?.split("@")[0] ?? t("nav.defaultUser")}</span>
                <span className="main-header-chevron">&#x2304;</span>
              </div>
              {userMenuOpen && (
                <div className="user-dropdown">
                  <Link to={user?.role === "supplier" ? "/supplier/profile" : "/business-profile"} className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    {t("common:myProfile")}
                  </Link>
                  <button type="button" className="user-dropdown-item" onClick={() => { clearAuth(); setUserMenuOpen(false); }}>
                    {t("common:logout")}
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
          aria-label={t("common:menu")}
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
                <Link to={user?.role === "supplier" ? "/supplier/profile" : "/business-profile"} onClick={() => setMobileMenuOpen(false)}>{t("common:myProfile")}</Link>
                <button type="button" className="mobile-nav-logout" onClick={() => { clearAuth(); setMobileMenuOpen(false); }}>{t("common:logout")}</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>{t("nav.login")}</Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>{t("nav.signup")}</Link>
              </>
            )}
          </nav>
        </>
      )}
      <ToastContainer />

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
