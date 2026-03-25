import { describe, expect, it, beforeEach, afterEach, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { AttachmentPreview } from "./AttachmentPreview"

vi.mock("../api/thread-api", () => ({
  downloadAttachment: vi.fn(),
  formatFileSize: vi.fn(() => "1 KB"),
  isPreviewableImage: vi.fn((contentType: string) => contentType.startsWith("image/")),
}))

describe("AttachmentPreview", () => {
  const objectUrl = "blob:preview-url"
  const originalClick = HTMLAnchorElement.prototype.click

  beforeEach(() => {
    vi.stubGlobal("open", vi.fn())
    HTMLAnchorElement.prototype.click = vi.fn()
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => objectUrl),
      revokeObjectURL: vi.fn(),
    })
  })

  afterEach(() => {
    HTMLAnchorElement.prototype.click = originalClick
    vi.unstubAllGlobals()
  })

  it("loads previewable images through the authenticated download API", async () => {
    const { downloadAttachment } = await import("../api/thread-api")
    vi.mocked(downloadAttachment).mockResolvedValue(new Blob(["image"], { type: "image/png" }))
    const onPreview = vi.fn()

    render(
      <AttachmentPreview
        attachment={{
          attachmentId: "att_01",
          fileName: "preview.png",
          contentType: "image/png",
          fileSize: 1024,
          url: "/api/threads/thd_01/attachments/att_01",
          createdAt: "2026-03-20T00:00:00Z",
        }}
        onPreview={onPreview}
      />,
    )

    await waitFor(() => {
      expect(downloadAttachment).toHaveBeenCalledWith("thd_01", "att_01")
    })

    fireEvent.click(screen.getByAltText("preview.png"))

    expect(onPreview).toHaveBeenCalledWith(objectUrl)
  })

  it("downloads files through the authenticated API", async () => {
    const { downloadAttachment } = await import("../api/thread-api")
    vi.mocked(downloadAttachment).mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" }))

    render(
      <AttachmentPreview
        attachment={{
          attachmentId: "att_02",
          fileName: "spec.pdf",
          contentType: "application/pdf",
          fileSize: 1024,
          url: "/api/threads/thd_02/attachments/att_02",
          createdAt: "2026-03-20T00:00:00Z",
        }}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "다운로드" }))

    await waitFor(() => {
      expect(downloadAttachment).toHaveBeenCalledWith("thd_02", "att_02")
    })
  })
})
