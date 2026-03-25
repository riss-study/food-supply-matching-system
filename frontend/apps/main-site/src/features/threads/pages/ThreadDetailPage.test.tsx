import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThreadDetailPage } from "../pages/ThreadDetailPage"
import { useThreadDetail } from "../hooks/useThreadDetail"
import { useMarkThreadRead } from "../hooks/useMarkThreadRead"

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

vi.mock("../../auth/store/auth-store", () => ({
  useAuthStore: vi.fn((selector) =>
    selector({
      user: { userId: "user_01", email: "test@test.com", role: "requester" },
    }),
  ),
}))

describe("ThreadDetailPage", () => {
  const markReadMutate = vi.fn()

  vi.mocked(useMarkThreadRead).mockReturnValue({
    mutate: markReadMutate,
  } as never)

  it("renders loading state", () => {
    markReadMutate.mockReset()
    vi.mocked(useThreadDetail).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as never)

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/threads/thread_01"]}>
          <Routes>
            <Route path="/threads/:threadId" element={<ThreadDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText("로딩 중...")).toBeInTheDocument()
  })

  it("renders thread detail with messages", () => {
    markReadMutate.mockReset()
    vi.mocked(useThreadDetail).mockReturnValue({
      data: {
        threadId: "thread_01",
        requestId: "req_01",
        requestTitle: "Test Request",
        otherParty: {
          displayName: "Supplier Co",
          role: "supplier",
          profileId: "sprof_01",
        },
        contactShareState: "not_requested",
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
        createdAt: "2026-03-20T00:00:00Z",
        updatedAt: "2026-03-20T01:00:00Z",
      },
      isLoading: false,
      error: null,
    } as never)

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/threads/thread_01"]}>
          <Routes>
            <Route path="/threads/:threadId" element={<ThreadDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText("Supplier Co")).toBeInTheDocument()
    expect(screen.getByText("의뢰: Test Request")).toBeInTheDocument()
    expect(screen.getByText("Hello there")).toBeInTheDocument()
  })

  it("renders empty message state", () => {
    markReadMutate.mockReset()
    vi.mocked(useThreadDetail).mockReturnValue({
      data: {
        threadId: "thread_01",
        requestId: "req_01",
        requestTitle: "Test Request",
        otherParty: {
          displayName: "Supplier Co",
          role: "supplier",
          profileId: "sprof_01",
        },
        contactShareState: "not_requested",
        messages: [],
        createdAt: "2026-03-20T00:00:00Z",
        updatedAt: "2026-03-20T01:00:00Z",
      },
      isLoading: false,
      error: null,
    } as never)

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/threads/thread_01"]}>
          <Routes>
            <Route path="/threads/:threadId" element={<ThreadDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText(/아직 메시지가 없습니다/)).toBeInTheDocument()
  })

  it("renders error state", () => {
    markReadMutate.mockReset()
    vi.mocked(useThreadDetail).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed to load"),
    } as never)

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/threads/thread_01"]}>
          <Routes>
            <Route path="/threads/:threadId" element={<ThreadDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText("대화 정보를 불러오지 못했습니다.")).toBeInTheDocument()
  })

  it("marks the thread as read only once per visit", () => {
    markReadMutate.mockReset()
    vi.mocked(useThreadDetail).mockReturnValue({
      data: {
        threadId: "thread_01",
        requestId: "req_01",
        requestTitle: "Test Request",
        otherParty: {
          displayName: "Supplier Co",
          role: "supplier",
          profileId: "sprof_01",
        },
        contactShareState: "not_requested",
        messages: [],
        createdAt: "2026-03-20T00:00:00Z",
        updatedAt: "2026-03-20T01:00:00Z",
      },
      isLoading: false,
      error: null,
    } as never)

    const client = createTestQueryClient()

    const view = render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/threads/thread_01"]}>
          <Routes>
            <Route path="/threads/:threadId" element={<ThreadDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    view.rerender(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/threads/thread_01"]}>
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
    markReadMutate.mockReset()
    vi.mocked(useThreadDetail).mockReturnValue({
      data: {
        threadId: "thread_01",
        requestId: "req_01",
        requestTitle: "Test Request",
        otherParty: {
          displayName: "Supplier Co",
          role: "supplier",
          profileId: "sprof_01",
        },
        contactShareState: "not_requested",
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
        createdAt: "2026-03-20T00:00:00Z",
        updatedAt: "2026-03-20T01:00:00Z",
      },
      isLoading: false,
      error: null,
    } as never)

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/threads/thread_01"]}>
          <Routes>
            <Route path="/threads/:threadId" element={<ThreadDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    const earlier = screen.getByText("Earlier message")
    const later = screen.getByText("Later message")

    expect(earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
