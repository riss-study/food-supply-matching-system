import { useQuery } from "@tanstack/react-query"
import { getLatestVerificationSubmission } from "../api/supplier-profile-api"

export function useLatestVerificationSubmission() {
  return useQuery({
    queryKey: ["latest-verification-submission"],
    queryFn: getLatestVerificationSubmission,
  })
}
