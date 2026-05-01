import { useState, useRef, useEffect } from "react"
import { Link, Navigate, Route, Routes } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute"
import { LoginPage } from "./features/auth/pages/LoginPage"
import { SignupPage } from "./features/auth/pages/SignupPage"
import { useAuthStore } from "./features/auth/store/auth-store"
import { useLogout } from "./features/auth/hooks/useLogout"
import { useNotificationStream } from "./features/notifications/hooks/useNotificationStream"
import { ToastContainer } from "./features/notifications/components/ToastContainer"
import { useNotificationStore, selectTotalUnread } from "./features/notifications/store/notification-store"
import { BusinessProfilePage, RequesterApprovalRoute, BusinessApprovalBanner } from "./features/business-profile"
import { SupplierSearchPage, SupplierDetailPage } from "./features/discovery"
import { QuoteComparisonPage } from "./features/quotes"
import { SupplierProfilePage, SupplierRoute, SupplierOnboardingStepper } from "./features/supplier-profile"
import { RequestListPage, RequestCreatePage, RequestDetailPage } from "./features/request-management"
import { SupplierRequestFeedPage, SupplierRequestDetailPage } from "./features/supplier-requests"
import { QuoteCreatePage, SupplierQuoteListPage } from "./features/supplier-quotes"
import { ThreadListPage, ThreadDetailPage } from "./features/threads"
import { NoticeListDetailPage } from "./features/notices"
import { GuidePage, GuideTeaserBanner } from "./features/guide"

type NavItem = {
  to: string
  label: string
}

/**
 * "/" 단일 진입점.
 *
 * 비로그인:  마케팅 랜딩 (Hero + 핵심기능 + 바로가기) 만 표시.
 * 로그인:    개인화된 시작 화면 (환영 + 배너/스테퍼 + 역할별 카드) 을 **위에**
 *            추가하고, 그 아래에는 기존 마케팅 랜딩을 그대로 유지한다 — 서비스
 *            소개 / 바로가기 카드 등은 로그인 사용자에게도 가치가 있어 손실 없이
 *            남긴다.
 *
 * 별도 /dashboard 라우트는 두지 않음. 헤더 "홈" / 브랜드 로고가 항상 사용자의
 * 시작점이 된다.
 */
function HomePage() {
  const user = useAuthStore((state) => state.user)
  return (
    <>
      {user && <AuthenticatedHome />}
      <PublicLandingHome />
    </>
  )
}

type Shortcut = {
  to: string
  icon: string
  title: string
  desc: string
  action: string
}

/**
 * 컨텍스트별 바로가기 카드 목록.
 *  - 비로그인 / role 미상 : 마케팅 기본 3종 (탐색·의뢰등록·내의뢰)
 *  - Requester             : 역할별 4종 (탐색·의뢰등록·내의뢰·메시지)
 *  - Supplier              : 역할별 4종 (의뢰피드·내견적·내프로필·메시지)
 *
 * "/" 화면에서 단 한 번만 노출되며, 위쪽 시작 화면(AuthenticatedHome) 은
 * 환영·배너·스테퍼 등 즉시 액션이 필요한 안내만 담당한다.
 */
function buildHomeShortcuts(
  role: string | null | undefined,
  t: (key: string) => string,
): Shortcut[] {
  if (role === "supplier") {
    return [
      { to: "/supplier/requests", icon: "📥", title: t("dashboard.supplierShortcut.feedTitle"), desc: t("dashboard.supplierShortcut.feedDesc"), action: t("dashboard.supplierShortcut.feedAction") },
      { to: "/supplier/quotes", icon: "📝", title: t("dashboard.supplierShortcut.quotesTitle"), desc: t("dashboard.supplierShortcut.quotesDesc"), action: t("dashboard.supplierShortcut.quotesAction") },
      { to: "/supplier/profile", icon: "👤", title: t("dashboard.supplierShortcut.profileTitle"), desc: t("dashboard.supplierShortcut.profileDesc"), action: t("dashboard.supplierShortcut.profileAction") },
      { to: "/threads", icon: "💬", title: t("dashboard.supplierShortcut.messagesTitle"), desc: t("dashboard.supplierShortcut.messagesDesc"), action: t("dashboard.supplierShortcut.messagesAction") },
    ]
  }
  if (role === "requester") {
    return [
      { to: "/suppliers", icon: "🔍", title: t("dashboard.requesterShortcut.exploreTitle"), desc: t("dashboard.requesterShortcut.exploreDesc"), action: t("dashboard.requesterShortcut.exploreAction") },
      { to: "/requests/new", icon: "➕", title: t("dashboard.requesterShortcut.createRequestTitle"), desc: t("dashboard.requesterShortcut.createRequestDesc"), action: t("dashboard.requesterShortcut.createRequestAction") },
      { to: "/requests", icon: "☰", title: t("dashboard.requesterShortcut.myRequestsTitle"), desc: t("dashboard.requesterShortcut.myRequestsDesc"), action: t("dashboard.requesterShortcut.myRequestsAction") },
      { to: "/threads", icon: "💬", title: t("dashboard.requesterShortcut.messagesTitle"), desc: t("dashboard.requesterShortcut.messagesDesc"), action: t("dashboard.requesterShortcut.messagesAction") },
    ]
  }
  // 비로그인 (기존 마케팅 랜딩 그대로)
  return [
    { to: "/suppliers", icon: "🔍", title: t("home.shortcutExploreTitle"), desc: t("home.shortcutExploreDesc"), action: t("home.shortcutExploreAction") },
    { to: "/requests/new", icon: "➕", title: t("home.shortcutCreateRequestTitle"), desc: t("home.shortcutCreateRequestDesc"), action: t("home.shortcutCreateRequestAction") },
    { to: "/requests", icon: "☰", title: t("home.shortcutMyRequestsTitle"), desc: t("home.shortcutMyRequestsDesc"), action: t("home.shortcutMyRequestsAction") },
  ]
}

function PublicLandingHome() {
  const { t } = useTranslation("app")
  const user = useAuthStore((state) => state.user)
  const shortcuts = buildHomeShortcuts(user?.role, t)

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
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link to="/guide" className="text-accent text-sm font-medium">
            {t("home.guideCta", { defaultValue: "전체 사용 흐름 보기 →" })}
          </Link>
        </div>
      </section>

      {/* 바로가기 — / 화면에서 한 번만 노출. 로그인 시 역할별 4종으로 자동 확장 */}
      <section className="home-section">
        <h2 className="home-section-title" style={{ textAlign: "left" }}>{t("home.shortcutSectionTitle")}</h2>
        <div className="card-grid">
          {shortcuts.map((sc) => (
            <Link key={sc.to} to={sc.to} className="surface home-shortcut">
              <div className="home-feature-icon">{sc.icon}</div>
              <h3 className="font-bold mb-4">{sc.title}</h3>
              <p className="text-muted text-sm mb-12">{sc.desc}</p>
              <span className="text-accent text-sm font-medium">{sc.action}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

/**
 * "/" 화면에서 로그인 사용자에게만 노출되는 안내 영역.
 *
 * 이메일 / 로그아웃 버튼 / "시작 화면" 제목 같은 메타 정보는 헤더 드롭다운과
 * 중복이라 두지 않는다. 즉시 액션이 필요한 안내 — 가이드 티저, 사업자 승인 배너,
 * 공급자 온보딩 스테퍼 — 만 띄운다. 조건이 모두 false 면 통째로 비어있어
 * 곧바로 PublicLandingHome 으로 이어진다.
 */
function AuthenticatedHome() {
  const user = useAuthStore((state) => state.user)
  return (
    <div className="page" style={{ padding: "32px 0 0" }}>
      <GuideTeaserBanner />
      <BusinessApprovalBanner />
      {user?.role === "supplier" && <SupplierOnboardingStepper />}
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
  const logout = useLogout()
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
    { to: "/guide", label: t("nav.guide") },
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
                  <button type="button" className="user-dropdown-item" onClick={() => { logout(); setUserMenuOpen(false); }}>
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
                <button type="button" className="mobile-nav-logout" onClick={() => { logout(); setMobileMenuOpen(false); }}>{t("common:logout")}</button>
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
          {/* /dashboard 는 폐기 — 외부 북마크/이전 링크 호환을 위해 / 로 redirect */}
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
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
          <Route
            path="/guide"
            element={<GuidePage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
