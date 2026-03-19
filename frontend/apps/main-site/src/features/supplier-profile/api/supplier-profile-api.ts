import type {
  ApiEnvelope,
  CreateSupplierProfileRequest,
  LatestVerificationSubmissionResponse,
  SupplierProfile,
  UpdateSupplierProfileRequest,
  VerificationSubmissionResponse,
} from "@fsm/types"
import { authApiClient } from "../../auth/lib/api-client"

export async function createSupplierProfile(request: CreateSupplierProfileRequest): Promise<SupplierProfile> {
  const response = await authApiClient.post<ApiEnvelope<SupplierProfile>>("/api/supplier/profile", request)
  return response.data.data
}

export async function getSupplierProfile(): Promise<SupplierProfile | null> {
  try {
    const response = await authApiClient.get<ApiEnvelope<SupplierProfile>>("/api/supplier/profile")
    return response.data.data
  } catch {
    return null
  }
}

export async function updateSupplierProfile(request: UpdateSupplierProfileRequest): Promise<SupplierProfile> {
  const response = await authApiClient.patch<ApiEnvelope<SupplierProfile>>("/api/supplier/profile", request)
  return response.data.data
}

export async function submitVerification(files: {
  businessRegistrationDoc: File
  certifications?: File[]
  portfolioImages?: File[]
}): Promise<VerificationSubmissionResponse> {
  const formData = new FormData()
  formData.append("businessRegistrationDoc", files.businessRegistrationDoc)
  files.certifications?.forEach((file) => formData.append("certifications", file))
  files.portfolioImages?.forEach((file) => formData.append("portfolioImages", file))

  const response = await authApiClient.post<ApiEnvelope<VerificationSubmissionResponse>>(
    "/api/supplier/verification-submissions",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  )
  return response.data.data
}

export async function getLatestVerificationSubmission(): Promise<LatestVerificationSubmissionResponse | null> {
  try {
    const response = await authApiClient.get<ApiEnvelope<LatestVerificationSubmissionResponse>>(
      "/api/supplier/verification-submissions/latest",
    )
    return response.data.data
  } catch {
    return null
  }
}
