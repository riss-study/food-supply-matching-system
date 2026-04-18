import { useState } from "react"
import { useSubmitVerification } from "../hooks/useSubmitVerification"

interface Props {
  profileId: string | undefined
}

export function VerificationSubmissionSection({ profileId }: Props) {
  const submitMutation = useSubmitVerification()
  const [businessRegistrationDoc, setBusinessRegistrationDoc] = useState<File | null>(null)
  const [certificationFiles, setCertificationFiles] = useState<File[]>([])
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([])

  const handleSubmit = () => {
    if (!businessRegistrationDoc) return
    submitMutation.mutate({
      businessRegistrationDoc,
      certifications: certificationFiles,
      portfolioImages: portfolioFiles,
    })
  }

  return (
    <div className="surface">
      <h2 className="section-title mb-16">검수 서류 제출</h2>
      <div className="form-stack">
        <div className="input-field">
          <label>사업자등록증 (필수)</label>
          <input
            type="file"
            accept=".pdf,image/png,image/jpeg"
            onChange={(e) => setBusinessRegistrationDoc(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="input-field">
          <label>인증서 파일들</label>
          <input
            type="file"
            multiple
            accept=".pdf,image/png,image/jpeg"
            onChange={(e) => setCertificationFiles(Array.from(e.target.files ?? []))}
          />
        </div>
        <div className="input-field">
          <label>포트폴리오 이미지</label>
          <input
            type="file"
            multiple
            accept=".png,.jpg,.jpeg,.pdf"
            onChange={(e) => setPortfolioFiles(Array.from(e.target.files ?? []))}
          />
        </div>
        <button
          className="btn btn-primary"
          disabled={!profileId || !businessRegistrationDoc || submitMutation.isPending}
          onClick={handleSubmit}
        >
          {submitMutation.isPending ? "제출 중..." : "검수 제출하기"}
        </button>
        {submitMutation.isError ? <p className="text-danger text-sm">검수 제출에 실패했습니다.</p> : null}
      </div>
    </div>
  )
}
