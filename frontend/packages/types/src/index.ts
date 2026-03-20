export type UserRole = "requester" | "supplier" | "admin"

export interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
  meta?: Record<string, unknown>
}

export interface PaginationMeta {
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
  hasNext?: boolean
  hasPrev?: boolean
}

export interface AuthenticatedUser {
  userId: string
  email: string
  role: UserRole
}

export interface SignupRequest {
  email: string
  password: string
  role: UserRole
  businessName: string
}

export interface SignupResponse {
  userId: string
  email: string
  role: UserRole
  createdAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: AuthenticatedUser
}

export type BusinessApprovalState = "not_submitted" | "submitted" | "approved" | "rejected"

export interface MeResponse {
  userId: string
  email: string
  role: UserRole
  businessApprovalState: BusinessApprovalState | null
  createdAt: string
}

export interface BusinessProfile {
  profileId: string
  businessName: string
  businessRegistrationNumber: string
  contactName: string
  contactPhone: string
  contactEmail: string
  verificationScope: string
  approvalState: BusinessApprovalState
  rejectionReason?: string
  submittedAt: string | null
  approvedAt: string | null
  rejectedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SubmitBusinessProfileRequest {
  businessName: string
  businessRegistrationNumber: string
  contactName: string
  contactPhone: string
  contactEmail: string
  verificationScope: string
}

export interface UpdateBusinessProfileRequest {
  businessName?: string
  businessRegistrationNumber?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  verificationScope?: string
}

export type SupplierVerificationState =
  | "draft"
  | "submitted"
  | "under_review"
  | "hold"
  | "approved"
  | "rejected"
  | "suspended"

export type ExposureState = "hidden" | "visible"

export interface CertificationRecord {
  recordId: string
  type: string
  number?: string | null
  fileAttachmentId: string
  status: string
}

export interface SupplierProfile {
  profileId: string
  companyName: string
  representativeName: string
  region: string
  categories: string[]
  equipmentSummary?: string | null
  monthlyCapacity: number
  moq: number
  oemAvailable: boolean
  odmAvailable: boolean
  rawMaterialSupport: boolean
  packagingLabelingSupport: boolean
  introduction?: string | null
  verificationState: SupplierVerificationState
  exposureState: ExposureState
  certifications: CertificationRecord[]
  createdAt: string
  updatedAt: string
}

export interface CreateSupplierProfileRequest {
  companyName: string
  representativeName: string
  region: string
  categories: string[]
  equipmentSummary?: string
  monthlyCapacity: number
  moq: number
  oemAvailable: boolean
  odmAvailable: boolean
  rawMaterialSupport: boolean
  packagingLabelingSupport: boolean
  introduction?: string
}

export interface UpdateSupplierProfileRequest {
  companyName?: string
  representativeName?: string
  region?: string
  categories?: string[]
  equipmentSummary?: string
  monthlyCapacity?: number
  moq?: number
  oemAvailable?: boolean
  odmAvailable?: boolean
  rawMaterialSupport?: boolean
  packagingLabelingSupport?: boolean
  introduction?: string
}

export interface VerificationSubmissionResponse {
  submissionId: string
  state: SupplierVerificationState
  submittedAt: string
  fileCount: number
}

export interface VerificationFileItem {
  fileId: string
  fileName: string
  status: string
}

export interface LatestVerificationSubmissionResponse {
  submissionId: string
  state: SupplierVerificationState
  submittedAt: string
  reviewedAt: string | null
  reviewNotePublic: string | null
  files: VerificationFileItem[]
}

export interface AdminReviewQueueItem {
  reviewId: string
  supplierProfileId: string
  companyName: string
  state: string
  submittedAt: string
  pendingDays: number
  verificationState: string
}

export interface AdminReviewDetail {
  reviewId: string
  supplierProfileId: string
  companyName: string
  representativeName: string
  region: string
  categories: string[]
  state: string
  submittedAt: string
  reviewedAt: string | null
  reviewNoteInternal: string | null
  reviewNotePublic: string | null
  files: Array<{ fileId: string; fileName: string; status: string }>
}

export interface ReviewDecisionRequest {
  noteInternal?: string
  notePublic?: string
  reasonCode?: string
}

export interface ReviewDecisionResponse {
  reviewId: string
  state: string
  supplierVerificationState: string
  exposureState: string
  reviewedAt: string
}

export interface SupplierSearchItemResponse {
  profileId: string
  companyName: string
  region: string
  categories: string[]
  monthlyCapacity: number
  moq: number
  oemAvailable: boolean
  odmAvailable: boolean
  verificationState: string
  exposureState: ExposureState
  logoUrl?: string | null
}

export interface SupplierCertificationSummaryResponse {
  type: string
  number?: string | null
  valid: boolean
}

export interface SupplierPortfolioImageResponse {
  imageId: string
  url: string
}

export interface SupplierDetailResponse {
  profileId: string
  companyName: string
  representativeName: string
  region: string
  categories: string[]
  equipmentSummary?: string | null
  monthlyCapacity: number
  moq: number
  oemAvailable: boolean
  odmAvailable: boolean
  rawMaterialSupport: boolean
  packagingLabelingSupport: boolean
  introduction?: string | null
  verificationState: string
  logoUrl?: string | null
  certifications: SupplierCertificationSummaryResponse[]
  portfolioImages: SupplierPortfolioImageResponse[]
}

export interface SupplierCategorySummaryResponse {
  category: string
  supplierCount: number
}

export interface SupplierRegionSummaryResponse {
  region: string
  supplierCount: number
}
