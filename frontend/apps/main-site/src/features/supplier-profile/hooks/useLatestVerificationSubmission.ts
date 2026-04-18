import { useQuery } from "@tanstack/react-query"
import { getLatestVerificationSubmission } from "../api/supplier-profile-api"
import { supplierProfileKeys } from "../query-keys"

export function useLatestVerificationSubmission() {
  return useQuery({
    queryKey: supplierProfileKeys.latestVerification(),
    queryFn: getLatestVerificationSubmission,
  })
}
