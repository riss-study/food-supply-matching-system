import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThreadListPage } from "../pages/ThreadListPage"
import { useThreads } from "../hooks/useThreads"

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

vi.mock("../hooks/useThreads", () => ({
  useThreads: vi.fn(),
}))

describe("ThreadListPage", () => {
  it("renders loading state", () => {
    vi.mocked(useThreads).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as never)

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ThreadListPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText("로딩 중...")).toBeInTheDocument()
  })

  it("renders thread list", () => {
    vi.mocked(useThreads).mockReturnValue({
      data: {
        items: [
          {
            threadId: "thread_01",
            requestId: "req_01",
            requestTitle: "Test Request",
            otherParty: {
              displayName: "Supplier Co",
              role: "supplier",
              profileId: "sprof_01",
            },
            unreadCount: 2,
            contactShareState: "not_requested",
            lastMessage: {
              messageId: "msg_01",
              senderUserId: "user_02",
              body: "Hello",
              hasAttachments: false,
              createdAt: "2026-03-20T00:00:00Z",
            },
            createdAt: "2026-03-20T00:00:00Z",
            updatedAt: "2026-03-20T01:00:00Z",
          },
        ],
        meta: { page: 1, size: 20, totalElements: 1, totalPages: 1, hasNext: false, hasPrev: false },
      },
      isLoading: false,
      error: null,
    } as never)

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ThreadListPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText("메시지")).toBeInTheDocument()
    expect(screen.getByText("Supplier Co")).toBeInTheDocument()
    expect(screen.getByText("의뢰: Test Request")).toBeInTheDocument()
    expect(screen.getByText("Hello")).toBeInTheDocument()
  })

  it("renders empty state", () => {
    vi.mocked(useThreads).mockReturnValue({
      data: { items: [], meta: { page: 1, size: 20, totalElements: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      isLoading: false,
      error: null,
    } as never)

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ThreadListPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText("아직 대화가 없습니다.")).toBeInTheDocument()
  })

  it("renders error state", () => {
    vi.mocked(useThreads).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed to load"),
    } as never)
  
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ThreadListPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText("메시지 목록을 불러오지 못했습니다.")).toBeInTheDocument()
  })
})
