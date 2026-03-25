import { useState } from "react"
import { Link, Navigate, Route, Routes } from "react-router-dom"
import { ProtectedAdminRoute } from "./features/auth/components/ProtectedAdminRoute"
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
import type { CreateNoticeRequest, UpdateNoticeRequest } from "@fsm/types"

function HomePage() {
  return (
    <section>
      <h1>Admin Review Workspace</h1>
      <p>Task 05 검수 큐와 검수 결정, Task 11 공지/통계 관리 작업 공간입니다.</p>
    </section>
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

  const handleSubmit = (data: CreateNoticeRequest | UpdateNoticeRequest) => {
    if (editingNoticeId) {
      updateNotice.mutate(
        { noticeId: editingNoticeId, request: data as UpdateNoticeRequest },
        {
          onSuccess: () => {
            handleCloseModal()
          },
        }
      )
    } else {
      createNotice.mutate(data as CreateNoticeRequest, {
        onSuccess: () => {
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
        onPublish={editingNotice?.state === "draft" ? handlePublish : undefined}
        onArchive={editingNotice?.state === "published" ? handleArchive : undefined}
        isSubmitting={isSubmitting}
      />
    </>
  )
}

export default function App() {
  return (
    <main style={{ padding: "2rem", fontFamily: '"Noto Sans JP", sans-serif' }}>
      <nav style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/reviews">Review Queue</Link>
        <Link to="/notices">Notices</Link>
        <Link to="/stats">Stats</Link>
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
        <Route
          path="/notices"
          element={
            <ProtectedAdminRoute>
              <NoticeManagementPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/stats"
          element={
            <ProtectedAdminRoute>
              <StatsDashboardPage />
            </ProtectedAdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  )
}
