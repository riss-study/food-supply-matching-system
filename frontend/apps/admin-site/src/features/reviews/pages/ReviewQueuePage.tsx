import { Link } from "react-router-dom"
import { useState } from "react"
import { useReviewQueue } from "../hooks/useReviewQueue"

export function ReviewQueuePage() {
  const [state, setState] = useState("")
  const { data, isLoading } = useReviewQueue(state || undefined)

  return (
    <section>
      <h1>검수 큐</h1>
      <label>
        상태 필터
        <select value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">전체</option>
          <option value="submitted">submitted</option>
          <option value="approved">approved</option>
          <option value="hold">hold</option>
          <option value="rejected">rejected</option>
        </select>
      </label>

      {isLoading ? <p>로딩 중...</p> : null}

      <table style={{ width: "100%", marginTop: "1rem", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>회사명</th>
            <th>상태</th>
            <th>제출일</th>
            <th>대기일수</th>
            <th>상세</th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((item) => (
            <tr key={item.reviewId}>
              <td>{item.companyName}</td>
              <td>{item.state}</td>
              <td>{new Date(item.submittedAt).toLocaleDateString("ko-KR")}</td>
              <td>{item.pendingDays}</td>
              <td>
                <Link to={`/reviews/${item.reviewId}`}>보기</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
