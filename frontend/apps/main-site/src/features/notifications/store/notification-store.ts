import { create } from "zustand"

export interface ToastNotification {
  id: string                   // messageId 재사용 (dedup 용)
  threadId: string
  threadTitle: string
  senderDisplayName: string
  preview: string
  sentAt: string               // ISO
}

interface NotificationState {
  toasts: ToastNotification[]
  unreadByThread: Record<string, number>

  pushToast(toast: ToastNotification): void
  dismissToast(id: string): void
  incrementUnread(threadId: string): void
  clearUnread(threadId: string): void
}

const TOAST_MAX = 5

export const useNotificationStore = create<NotificationState>()((set) => ({
  toasts: [],
  unreadByThread: {},

  pushToast: (toast) =>
    set((state) => {
      // dedup: 같은 messageId 이미 있으면 무시
      if (state.toasts.some((t) => t.id === toast.id)) return state
      const next = [...state.toasts, toast]
      // 5개 초과 시 가장 오래된 것 제거
      const trimmed = next.length > TOAST_MAX ? next.slice(next.length - TOAST_MAX) : next
      return { toasts: trimmed }
    }),

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  incrementUnread: (threadId) =>
    set((state) => ({
      unreadByThread: {
        ...state.unreadByThread,
        [threadId]: (state.unreadByThread[threadId] ?? 0) + 1,
      },
    })),

  clearUnread: (threadId) =>
    set((state) => {
      if (!state.unreadByThread[threadId]) return state
      const { [threadId]: _, ...rest } = state.unreadByThread
      return { unreadByThread: rest }
    }),
}))

/** 전체 unread 합산 selector — totalUnread 가 변경될 때만 re-render */
export const selectTotalUnread = (state: NotificationState): number =>
  Object.values(state.unreadByThread).reduce((sum, n) => sum + n, 0)
