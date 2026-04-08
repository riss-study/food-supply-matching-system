import { useState, useRef, useEffect } from "react"
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom"

import { useAdminAuthStore } from "./features/auth/store/admin-auth-store"
import { LoginPage } from "./features/auth/pages/LoginPage"
import { ReviewQueuePage } from "./features/reviews/pages/ReviewQueuePage"
import { ReviewDetailPage } from "./features/reviews/pages/ReviewDetailPage"
import { NoticeListPage } from "./features/notices/pages/NoticeListPage"
import { NoticeCreateEditModal } from "./features/notices/components/NoticeCreateEditModal"
import { StatsDashboardPage } from "./features/stats/pages/StatsDashboardPage"
import { useCreateNotice } from "./features/notices/hooks/useCreateNotice"
import { useUpdateNotice } from "./features/notices/hooks/useUpdateNotice"
import { usePublishNotice } from "./features/notices/hooks/usePublishNotice"
import { useArchiveNotice } from "./features/notices/hooks/useArchiveNotice"
import { useNoticeDetail } from "./features/notices/hooks/useNoticeDetail"
import { uploadNoticeAttachment, deleteNoticeAttachment } from "./features/notices/api/notices-api"
import type { CreateNoticeRequest, UpdateNoticeRequest } from "@fsm/types"

function HomePage() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>운영 작업 공간</h1>
        <p>검수, 공지, 통계를 빠르게 확인하고 운영 판단을 내리는 내부 작업 공간입니다.</p>
      </div>
    </div>
  )
}

function NoticeManagementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null)

  const { data: editingNotice } = useNoticeDetail(editingNoticeId || "")
  const createNotice = useCreateNotice()
  const updateNotice = useUpdateNotice()
  const publishNotice = usePublishNotice()
  const archiveNotice = useArchiveNotice()

  const handleCreateClick = () => {
    setEditingNoticeId(null)
    setIsModalOpen(true)
  }

  const handleEditClick = (noticeId: string) => {
    setEditingNoticeId(noticeId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingNoticeId(null)
  }

  const uploadFiles = async (noticeId: string, files: File[]) => {
    for (const file of files) {
      await uploadNoticeAttachment(noticeId, file)
    }
  }

  const deleteFiles = async (noticeId: string, attachmentIds: string[]) => {
    for (const id of attachmentIds) {
      await deleteNoticeAttachment(noticeId, id)
    }
  }

  const handleSubmit = (data: CreateNoticeRequest | UpdateNoticeRequest, newFiles?: File[], removedAttachmentIds?: string[]) => {
    if (editingNoticeId) {
      updateNotice.mutate(
        { noticeId: editingNoticeId, request: data as UpdateNoticeRequest },
        {
          onSuccess: async () => {
            if (removedAttachmentIds?.length) await deleteFiles(editingNoticeId, removedAttachmentIds)
            if (newFiles?.length) await uploadFiles(editingNoticeId, newFiles)
            handleCloseModal()
          },
        }
      )
    } else {
      createNotice.mutate(data as CreateNoticeRequest, {
        onSuccess: async (response) => {
          if (newFiles?.length) await uploadFiles(response.noticeId, newFiles)
          handleCloseModal()
        },
      })
    }
  }

  const handlePublish = () => {
    if (editingNoticeId) {
      publishNotice.mutate(editingNoticeId, {
        onSuccess: () => {
          handleCloseModal()
        },
      })
    }
  }

  const handleArchive = () => {
    if (editingNoticeId) {
      archiveNotice.mutate(editingNoticeId, {
        onSuccess: () => {
          handleCloseModal()
        },
      })
    }
  }

  const isSubmitting =
    createNotice.isPending ||
    updateNotice.isPending ||
    publishNotice.isPending ||
    archiveNotice.isPending

  return (
    <>
      <NoticeListPage
        onCreateClick={handleCreateClick}
        onEditClick={handleEditClick}
      />
      <NoticeCreateEditModal
        isOpen={isModalOpen}
        notice={editingNotice || null}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onPublish={editingNotice?.state === "draft" || editingNotice?.state === "archived" ? handlePublish : undefined}
        onArchive={editingNotice?.state === "published" ? handleArchive : undefined}
        isSubmitting={isSubmitting}
      />
    </>
  )
}

const navItems = [
  { to: "/reviews", label: "업체 검수", icon: "☑" },
  { to: "/notices", label: "공지 관리", icon: "☰" },
  { to: "/stats", label: "통계", icon: "≡" },
]

export default function App() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const adminUser = useAdminAuthStore((s) => s.user)
  const clearAdminAuth = useAdminAuthStore((s) => s.clearAuth)
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

  // Close sidebar on route change
  const closeSidebar = () => setSidebarOpen(false)

  // 비로그인 또는 관리자가 아닌 경우 로그인 페이지
  if (!adminUser || adminUser.role !== "admin") {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="admin-shell">
      <button
        className="admin-sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="메뉴 열기"
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      <div
        className={`admin-sidebar-overlay${sidebarOpen ? " open" : ""}`}
        onClick={closeSidebar}
      />

      <aside className={`admin-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="admin-sidebar-brand">잇다 <small>Admin</small></div>
        <nav className="admin-sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={location.pathname.startsWith(item.to) ? "active" : ""}
              onClick={closeSidebar}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <span>{adminUser.email?.split("@")[0] ?? "관리자"}</span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm w-full"
            onClick={() => { clearAdminAuth(); closeSidebar(); }}
          >
            로그아웃
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div style={{ flex: 1 }} />
          <div className="admin-topbar-user-wrap" ref={userMenuRef}>
            <div className="admin-topbar-user" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <div className="admin-topbar-avatar" />
              <span className="admin-topbar-username">{adminUser.email?.split("@")[0] ?? "관리자"}</span>
              <span className="admin-topbar-chevron">&#x2304;</span>
            </div>
            {userMenuOpen && (
              <div className="admin-user-dropdown">
                <button type="button" className="admin-user-dropdown-item" onClick={() => { clearAdminAuth(); setUserMenuOpen(false); }}>
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="admin-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/reviews" element={<ReviewQueuePage />} />
            <Route path="/reviews/:reviewId" element={<ReviewDetailPage />} />
            <Route path="/notices" element={<NoticeManagementPage />} />
            <Route path="/stats" element={<StatsDashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
