import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThreadDetailPage } from "../pages/ThreadDetailPage"
import { useThreadDetail } from "../hooks/useThreadDetail"
import { useMarkThreadRead } from "../hooks/useMarkThreadRead"
import { useRequestContactShare } from "../hooks/useRequestContactShare"
import { useApproveContactShare } from "../hooks/useApproveContactShare"
import { useRevokeContactShare } from "../hooks/useRevokeContactShare"

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

vi.mock("../hooks/useThreadDetail", () => ({
  useThreadDetail: vi.fn(),
}))

vi.mock("../hooks/useSendMessage", () => ({
  useSendMessage: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}))

vi.mock("../hooks/useMarkThreadRead", () => ({
  useMarkThreadRead: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}))

vi.mock("../hooks/useUploadAttachment", () => ({
  useUploadAttachment: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}))

vi.mock("../hooks/useRequestContactShare", () => ({
  useRequestContactShare: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}))

vi.mock("../hooks/useApproveContactShare", () => ({
  useApproveContactShare: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}))

vi.mock("../hooks/useRevokeContactShare", () => ({
  useRevokeContactShare: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}))

vi.mock("../../auth/store/auth-store", () => ({
  useAuthStore: vi.fn((selector) =>
    selector({
      user: { userId: "user_01", email: "test@test.com", role: "requester" },
    }),
  ),
}))

describe("ThreadDetailPage", () => {
  const markReadMutate = vi.fn()
  const requestContactShareMutate = vi.fn()
  const approveContactShareMutate = vi.fn()
  const revokeContactShareMutate = vi.fn()

  const baseThread = {
    threadId: "thread_01",
    requestId: "req_01",
    requestTitle: "Test Request",
    otherParty: {
      displayName: "Supplier Co",
      role: "supplier",
      profileId: "sprof_01",
    },
    contactShareState: "not_requested" as const,
    contactShareRequestedByRole: null,
    requesterApproved: false,
    supplierApproved: false,
    sharedContact: null,
    messages: [],
    createdAt: "2026-03-20T00:00:00Z",
    updatedAt: "2026-03-20T01:00:00Z",
  }

  beforeEach(() => {
    vi.spyOn(window, "confirm").mockReturnValue(true)
    markReadMutate.mockReset()
    requestContactShareMutate.mockReset()
    approveContactShareMutate.mockReset()
    revokeContactShareMutate.mockReset()
    vi.mocked(useMarkThreadRead).mockReturnValue({ mutate: markReadMutate } as never)
    vi.mocked(useRequestContactShare).mockReturnValue({ mutate: requestContactShareMutate, isPending: false } as never)
    vi.mocked(useApproveContactShare).mockReturnValue({ mutate: approveContactShareMutate, isPending: false } as never)
    vi.mocked(useRevokeContactShare).mockReturnValue({ mutate: revokeContactShareMutate, isPending: false } as never)
  })

  function renderPage() {
    return render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/threads/thread_01"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/threads/:threadId" element={<ThreadDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it("renders loading state", () => {
    vi.mocked(useThreadDetail).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as never)

    renderPage()
    expect(screen.getByText("로딩 중...")).toBeInTheDocument()
  })

  it("renders thread detail with messages", () => {
    vi.mocked(useThreadDetail).mockReturnValue({
      data: {
        ...baseThread,
        messages: [
          {
            messageId: "msg_01",
            senderUserId: "user_02",
            senderType: "supplier",
            body: "Hello there",
            attachments: [],
            createdAt: "2026-03-20T00:00:00Z",
          },
        ],
      },
      isLoading: false,
      error: null,
    } as never)

    renderPage()
    expect(screen.getByText(/Supplier Co/)).toBeInTheDocument()
    expect(screen.getByText("Test Request")).toBeInTheDocument()
    expect(screen.getByText("Hello there")).toBeInTheDocument()
  })

  it("renders empty message state", () => {
    vi.mocked(useThreadDetail).mockReturnValue({ data: baseThread, isLoading: false, error: null } as never)
    renderPage()
    expect(screen.getByText(/아직 메시지가 없습니다/)).toBeInTheDocument()
  })

  it("renders error state", () => {
    vi.mocked(useThreadDetail).mockReturnValue({ data: undefined, isLoading: false, error: new Error("Failed") } as never)
    renderPage()
    expect(screen.getByText("대화 정보를 불러오지 못했습니다.")).toBeInTheDocument()
  })

  it("marks the thread as read only once per visit", () => {
    vi.mocked(useThreadDetail).mockReturnValue({ data: baseThread, isLoading: false, error: null } as never)
    const client = createTestQueryClient()

    const view = render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/threads/thread_01"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/threads/:threadId" element={<ThreadDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    view.rerender(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/threads/thread_01"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/threads/:threadId" element={<ThreadDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(markReadMutate).toHaveBeenCalledTimes(1)
    expect(markReadMutate).toHaveBeenCalledWith("thread_01")
  })

  it("renders messages in chronological order", () => {
    vi.mocked(useThreadDetail).mockReturnValue({
      data: {
        ...baseThread,
        messages: [
          {
            messageId: "msg_02",
            senderUserId: "user_02",
            senderType: "supplier",
            body: "Later message",
            attachments: [],
            createdAt: "2026-03-20T01:00:00Z",
          },
          {
            messageId: "msg_01",
            senderUserId: "user_02",
            senderType: "supplier",
            body: "Earlier message",
            attachments: [],
            createdAt: "2026-03-20T00:00:00Z",
          },
        ],
      },
      isLoading: false,
      error: null,
    } as never)

    renderPage()
    const earlier = screen.getByText("Earlier message")
    const later = screen.getByText("Later message")
    expect(earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("shows request CTA when contact share has not started", () => {
    vi.mocked(useThreadDetail).mockReturnValue({ data: baseThread, isLoading: false, error: null } as never)
    renderPage()
    fireEvent.click(screen.getByRole("button", { name: "연락처 공유 요청" }))
    expect(requestContactShareMutate).toHaveBeenCalled()
  })

  it("shows shared contacts when contact share is mutually approved", () => {
    vi.mocked(useThreadDetail).mockReturnValue({
      data: {
        ...baseThread,
        contactShareState: "mutually_approved",
        contactShareRequestedByRole: "requester",
        requesterApproved: true,
        supplierApproved: true,
        sharedContact: {
          requester: { name: "요청자", phone: "010-1111-2222", email: "req@test.com" },
          supplier: { name: "공급자", phone: "010-3333-4444", email: "sup@test.com" },
        },
      },
      isLoading: false,
      error: null,
    } as never)

    renderPage()
    expect(screen.getByText("요청자")).toBeInTheDocument()
    expect(screen.getByText("공급자")).toBeInTheDocument()
    expect(screen.getByText(/010-3333-4444/)).toBeInTheDocument()
  })

  it("allows a new request after contact share was revoked", () => {
    vi.mocked(useThreadDetail).mockReturnValue({
      data: {
        ...baseThread,
        contactShareState: "revoked",
        contactShareRequestedByRole: "requester",
      },
      isLoading: false,
      error: null,
    } as never)

    renderPage()
    expect(screen.getByRole("button", { name: "연락처 공유 요청" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "요청 철회" })).not.toBeInTheDocument()
  })
})
