import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NoticeListPage } from "../pages/NoticeListPage"
import { useNotices } from "../hooks/useNotices"

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

vi.mock("../hooks/useNotices", () => ({
  useNotices: vi.fn(),
}))

describe("NoticeListPage", () => {
  it("renders loading state", () => {
    vi.mocked(useNotices).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as never)

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <NoticeListPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText("로딩 중...")).toBeInTheDocument()
  })

  it("renders notice list", () => {
    vi.mocked(useNotices).mockReturnValue({
      data: {
        items: [
          {
            noticeId: "notice_01",
            title: "Test Notice",
            excerpt: "This is a test notice",
            state: "published",
            author: "Admin User",
            authorId: "admin_01",
            authorName: "Admin User",
            publishedAt: "2026-03-20T00:00:00Z",
            viewCount: 100,
            createdAt: "2026-03-19T00:00:00Z",
            updatedAt: "2026-03-20T00:00:00Z",
          },
        ],
        meta: { page: 1, size: 20, totalElements: 1, totalPages: 1, hasNext: false, hasPrev: false },
      },
      isLoading: false,
      error: null,
    } as never)

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <NoticeListPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText("공지사항 관리")).toBeInTheDocument()
    expect(screen.getByText("Test Notice")).toBeInTheDocument()
    expect(screen.getByText("Admin User")).toBeInTheDocument()
    expect(screen.getByText("100")).toBeInTheDocument()
  })

  it("renders empty state", () => {
    vi.mocked(useNotices).mockReturnValue({
      data: { items: [], meta: { page: 1, size: 20, totalElements: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      isLoading: false,
      error: null,
    } as never)

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <NoticeListPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText("공지사항 관리")).toBeInTheDocument()
  })

  it("calls onCreateClick when new notice button is clicked", () => {
    vi.mocked(useNotices).mockReturnValue({
      data: { items: [], meta: { page: 1, size: 20, totalElements: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      isLoading: false,
      error: null,
    } as never)

    const onCreateClick = vi.fn()

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <NoticeListPage onCreateClick={onCreateClick} />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    screen.getByText("새 공지 작성").click()
    expect(onCreateClick).toHaveBeenCalled()
  })
})
