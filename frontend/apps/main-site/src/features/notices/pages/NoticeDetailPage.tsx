import { useParams, Link } from "react-router-dom"
import { usePublicNoticeDetail } from "../hooks/usePublicNoticeDetail"

export function NoticeDetailPage() {
  const { noticeId } = useParams<{ noticeId: string }>()
  const { data, isLoading, error } = usePublicNoticeDetail(noticeId || "")

  const containerStyle: React.CSSProperties = {
    maxWidth: "800px",
    margin: "0 auto",
  }

  const backLinkStyle: React.CSSProperties = {
    display: "inline-block",
    marginBottom: "1rem",
    color: "#3b82f6",
    textDecoration: "none",
  }

  const headerStyle: React.CSSProperties = {
    borderBottom: "2px solid #e5e7eb",
    paddingBottom: "1rem",
    marginBottom: "2rem",
  }

  const titleStyle: React.CSSProperties = {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#111827",
    marginBottom: "0.5rem",
  }

  const metaStyle: React.CSSProperties = {
    display: "flex",
    gap: "1rem",
    fontSize: "0.875rem",
    color: "#6b7280",
  }

  const bodyStyle: React.CSSProperties = {
    fontSize: "1rem",
    lineHeight: 1.8,
    color: "#374151",
    whiteSpace: "pre-wrap",
    marginBottom: "2rem",
  }

  const attachmentsStyle: React.CSSProperties = {
    backgroundColor: "#f9fafb",
    padding: "1rem",
    borderRadius: "8px",
  }

  const attachmentItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0",
    borderBottom: "1px solid #e5e7eb",
  }

  const attachmentLinkStyle: React.CSSProperties = {
    color: "#3b82f6",
    textDecoration: "none",
  }

  if (isLoading) {
    return (
      <section style={containerStyle}>
        <Link to="/notices" style={backLinkStyle}>
          ← 목록으로 돌아가기
        </Link>
        <p>로딩 중...</p>
      </section>
    )
  }

  if (error || !data) {
    return (
      <section style={containerStyle}>
        <Link to="/notices" style={backLinkStyle}>
          ← 목록으로 돌아가기
        </Link>
        <p>공지사항을 불러오지 못했습니다.</p>
      </section>
    )
  }

  return (
    <section style={containerStyle}>
      <Link to="/notices" style={backLinkStyle}>
        ← 목록으로 돌아가기
      </Link>

      <header style={headerStyle}>
        <h1 style={titleStyle}>{data.title}</h1>
        <div style={metaStyle}>
          <span>
            게시일:{" "}
            {new Date(data.publishedAt).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span>조회수: {data.viewCount.toLocaleString()}</span>
        </div>
      </header>

      <article style={bodyStyle}>{data.body}</article>

      {data.attachments.length > 0 && (
        <div style={attachmentsStyle}>
          <h3>첨부 파일</h3>
          {data.attachments.map((attachment) => (
            <div key={attachment.attachmentId} style={attachmentItemStyle}>
              <span>📎</span>
              <a
                href={attachment.url}
                download={attachment.fileName}
                style={attachmentLinkStyle}
              >
                {attachment.fileName}
              </a>
              <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>
                ({(attachment.fileSize / 1024).toFixed(1)} KB)
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
