import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NoticeDetailPage } from "../pages/NoticeDetailPage"
import { usePublicNoticeDetail } from "../hooks/usePublicNoticeDetail"

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

vi.mock("../hooks/usePublicNoticeDetail", () => ({
  usePublicNoticeDetail: vi.fn(),
}))

describe("Public NoticeDetailPage", () => {
  it("renders loading state", () => {
    vi.mocked(usePublicNoticeDetail).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as never)

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/notices/notice_01"]}>
          <Routes>
            <Route path="/notices/:noticeId" element={<NoticeDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText("로딩 중...")).toBeInTheDocument()
  })

  it("renders notice detail with attachments", () => {
    vi.mocked(usePublicNoticeDetail).mockReturnValue({
      data: {
        noticeId: "notice_01",
        title: "Test Notice Detail",
        body: "This is the full body of the notice.",
        publishedAt: "2026-03-20T00:00:00Z",
        viewCount: 150,
        attachments: [
          {
            attachmentId: "attach_01",
            fileName: "test-file.pdf",
            contentType: "application/pdf",
            fileSize: 1024000,
            url: "https://example.com/test-file.pdf",
            createdAt: "2026-03-20T00:00:00Z",
          },
        ],
      },
      isLoading: false,
      error: null,
    } as never)

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/notices/notice_01"]}>
          <Routes>
            <Route path="/notices/:noticeId" element={<NoticeDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText("Test Notice Detail")).toBeInTheDocument()
    expect(screen.getByText("This is the full body of the notice.")).toBeInTheDocument()
    expect(screen.getByText("첨부 파일")).toBeInTheDocument()
    expect(screen.getByText("test-file.pdf")).toBeInTheDocument()
  })

  it("renders error state", () => {
    vi.mocked(usePublicNoticeDetail).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed to load"),
    } as never)

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/notices/notice_01"]}>
          <Routes>
            <Route path="/notices/:noticeId" element={<NoticeDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText("공지사항을 불러오지 못했습니다.")).toBeInTheDocument()
  })
})
