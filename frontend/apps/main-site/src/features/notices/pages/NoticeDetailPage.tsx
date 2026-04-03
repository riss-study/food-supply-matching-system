import { useParams, Link } from "react-router-dom"
import { usePublicNoticeDetail } from "../hooks/usePublicNoticeDetail"

export function NoticeDetailPage() {
  const { noticeId } = useParams<{ noticeId: string }>()
  const { data, isLoading, error } = usePublicNoticeDetail(noticeId || "")

  if (isLoading) {
    return (
      <div className="page">
        <Link to="/notices" className="text-accent text-sm">
          &larr; 목록으로 돌아가기
        </Link>
        <p>로딩 중...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="page">
        <Link to="/notices" className="text-accent text-sm">
          &larr; 목록으로 돌아가기
        </Link>
        <p className="text-danger">공지사항을 불러오지 못했습니다.</p>
      </div>
    )
  }

  return (
    <div className="page">
      <Link to="/notices" className="text-accent text-sm">
        &larr; 목록으로 돌아가기
      </Link>

      <header className="border-b mb-20 pb-16">
        <h1 className="text-2xl font-bold mb-8">{data.title}</h1>
        <div className="flex gap-16 text-sm text-muted">
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

      <article className="surface pre-wrap">{data.body}</article>

      {data.attachments.length > 0 && (
        <div className="surface bg-panel">
          <h3 className="section-title mb-12">첨부 파일</h3>
          {data.attachments.map((attachment) => (
            <div key={attachment.attachmentId} className="flex items-center gap-8 border-b p-8">
              <a
                href={attachment.url}
                download={attachment.fileName}
                className="text-accent"
              >
                {attachment.fileName}
              </a>
              <span className="text-sm text-muted">
                ({(attachment.fileSize / 1024).toFixed(1)} KB)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
