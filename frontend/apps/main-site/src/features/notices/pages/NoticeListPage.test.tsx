import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NoticeListPage } from "../pages/NoticeListPage"
import { usePublicNotices } from "../hooks/usePublicNotices"

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

vi.mock("../hooks/usePublicNotices", () => ({
  usePublicNotices: vi.fn(),
}))

describe("Public NoticeListPage", () => {
  it("renders loading state", () => {
    vi.mocked(usePublicNotices).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as never)

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <NoticeListPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText("로딩 중...")).toBeInTheDocument()
  })

  it("renders public notice list", () => {
    vi.mocked(usePublicNotices).mockReturnValue({
      data: {
        items: [
          {
            noticeId: "notice_01",
            title: "Public Test Notice",
            excerpt: "This is a public notice excerpt",
            publishedAt: "2026-03-20T00:00:00Z",
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
          <NoticeListPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText("공지사항")).toBeInTheDocument()
    expect(screen.getByText("Public Test Notice")).toBeInTheDocument()
    expect(screen.getByText("This is a public notice excerpt")).toBeInTheDocument()
  })

  it("renders empty state", () => {
    vi.mocked(usePublicNotices).mockReturnValue({
      data: { items: [], meta: { page: 1, size: 20, totalElements: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      isLoading: false,
      error: null,
    } as never)

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <NoticeListPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText("등록된 공지사항이 없습니다.")).toBeInTheDocument()
  })

  it("renders error state", () => {
    vi.mocked(usePublicNotices).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed to load"),
    } as never)

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <NoticeListPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText("공지사항을 불러오지 못했습니다.")).toBeInTheDocument()
  })
})
