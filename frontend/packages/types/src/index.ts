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

export type RequestState = "draft" | "open" | "closed" | "cancelled"
export type RequestMode = "public" | "targeted"
export type RawMaterialRule = "requester_provided" | "supplier_provided"
export type PackagingRequirement = "private_label" | "bulk" | "none"

export interface TargetPriceRange {
  min?: number
  max?: number
}

export interface TargetSupplier {
  supplierProfileId: string
  companyName: string
}

export interface RequestSummary {
  requestId: string
  title: string
  category: string
  state: RequestState
  mode: RequestMode
  quoteCount: number
  createdAt: string
  expiresAt?: string
}

export interface RequestDetail {
  requestId: string
  mode: RequestMode
  title: string
  category: string
  desiredVolume: number
  targetPriceRange?: TargetPriceRange
  certificationRequirement: string[]
  rawMaterialRule?: RawMaterialRule
  packagingRequirement?: PackagingRequirement
  deliveryRequirement?: string
  notes?: string
  state: RequestState
  requester: {
    businessName: string
    contactName: string
  }
  createdAt: string
  targetSuppliers: TargetSupplier[]
}

export interface CreateRequestRequest {
  mode: RequestMode
  title: string
  category: string
  desiredVolume: number
  targetPriceRange?: TargetPriceRange
  certificationRequirement?: string[]
  rawMaterialRule?: RawMaterialRule
  packagingRequirement?: PackagingRequirement
  deliveryRequirement?: string
  notes?: string
  targetSupplierIds?: string[]
}

export interface CreateRequestResponse {
  requestId: string
  state: RequestState
  createdAt: string
}

export interface UpdateRequestRequest {
  title?: string
  desiredVolume?: number
  targetPriceRange?: TargetPriceRange
  certificationRequirement?: string[]
  rawMaterialRule?: RawMaterialRule
  packagingRequirement?: PackagingRequirement
  deliveryRequirement?: string
  notes?: string
}

export interface UpdateRequestResponse {
  requestId: string
  state: RequestState
  updatedAt: string
}

export interface PublishRequestResponse {
  requestId: string
  state: RequestState
  publishedAt: string
}

export interface CloseRequestResponse {
  requestId: string
  state: RequestState
  closedAt: string
}

export interface CancelRequestRequest {
  reason?: string
}

export interface CancelRequestResponse {
  requestId: string
  state: RequestState
  cancelledAt: string
}

export interface SupplierRequestFeedItem {
  requestId: string
  title: string
  category: string
  desiredVolume: number
  targetPriceRange?: TargetPriceRange
  mode: RequestMode
  requesterBusinessName: string
  certificationRequirement?: string[]
  createdAt: string
  hasQuoted: boolean
}

export interface SupplierRequestDetail {
  requestId: string
  mode: RequestMode
  title: string
  category: string
  desiredVolume: number
  targetPriceRange?: TargetPriceRange
  certificationRequirement?: string[]
  rawMaterialRule?: RawMaterialRule
  packagingRequirement?: PackagingRequirement
  deliveryRequirement?: string
  notes?: string
  state: RequestState
  requesterBusinessName: string
  createdAt: string
  hasQuoted: boolean
}

export type QuoteState = "submitted" | "selected" | "withdrawn" | "declined"

export interface SubmitQuoteRequest {
  unitPriceEstimate: number
  moq: number
  leadTime: number
  sampleCost?: number
  note?: string
}

export interface UpdateQuoteRequest {
  unitPriceEstimate?: number
  moq?: number
  leadTime?: number
  sampleCost?: number
  note?: string
}

export interface SubmitQuoteResponse {
  quoteId: string
  state: QuoteState
  threadId: string
  createdAt: string
}

export interface UpdateQuoteResponse {
  quoteId: string
  state: QuoteState
  version: number
  updatedAt: string
}

export interface WithdrawQuoteResponse {
  quoteId: string
  state: QuoteState
  withdrawnAt: string
}

export interface SelectQuoteResponse {
  quoteId: string
  state: QuoteState
  requestState: RequestState
  selectedAt: string
}

export interface DeclineQuoteRequest {
  reason?: string
}

export interface DeclineQuoteResponse {
  quoteId: string
  state: QuoteState
  declinedAt: string
}

export interface RequestQuoteSummary {
  quoteId: string
  supplierId: string
  companyName: string
  unitPriceEstimate: number
  moq: number
  leadTime: number
  sampleCost?: number
  state: QuoteState
  threadId: string
  submittedAt: string
}

export interface SupplierQuoteSummary {
  quoteId: string
  requestId: string
  requestTitle: string
  category: string
  unitPriceEstimate: number
  moq: number
  leadTime: number
  sampleCost?: number
  state: QuoteState
  version: number
  threadId: string
  submittedAt: string
}
