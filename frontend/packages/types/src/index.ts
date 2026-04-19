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
  contactPhone?: string | null
  contactEmail?: string | null
  region: string
  categories: string[]
  equipmentSummary?: string | null
  monthlyCapacity: string
  moq: string
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
  contactPhone?: string
  contactEmail?: string
  region: string
  categories: string[]
  equipmentSummary?: string
  monthlyCapacity: string
  moq: string
  oemAvailable: boolean
  odmAvailable: boolean
  rawMaterialSupport: boolean
  packagingLabelingSupport: boolean
  introduction?: string
}

export interface UpdateSupplierProfileRequest {
  companyName?: string
  representativeName?: string
  contactPhone?: string
  contactEmail?: string
  region?: string
  categories?: string[]
  equipmentSummary?: string
  monthlyCapacity?: string
  moq?: string
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

export interface AdminReviewHistoryItem {
  actionType: string
  actorUserId: string
  createdAt: string
  noteInternal: string | null
  notePublic: string | null
  reasonCode: string | null
}

export interface AdminReviewDetailFile {
  fileId: string
  fileName: string
  status: string
  downloadUrl: string | null
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
  files: AdminReviewDetailFile[]
  reviewHistory: AdminReviewHistoryItem[]
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
  monthlyCapacity: string
  moq: string
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
  monthlyCapacity: string
  moq: string
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
  min?: string
  max?: string
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
  desiredVolume: string
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
  quoteCount?: number
  createdAt: string
  targetSuppliers: TargetSupplier[]
}

export interface CreateRequestRequest {
  mode: RequestMode
  title: string
  category: string
  desiredVolume: string
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
  desiredVolume?: string
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
  desiredVolume: string
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
  desiredVolume: string
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
  unitPriceEstimate: string
  moq: string
  leadTime: string
  sampleCost?: string
  note?: string
}

export interface UpdateQuoteRequest {
  unitPriceEstimate?: string
  moq?: string
  leadTime?: string
  sampleCost?: string
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
  unitPriceEstimate: string
  moq: string
  leadTime: string
  sampleCost?: string
  state: QuoteState
  threadId: string
  submittedAt: string
}

export interface SupplierQuoteSummary {
  quoteId: string
  requestId: string
  requestTitle: string
  category: string
  unitPriceEstimate: string
  moq: string
  leadTime: string
  sampleCost?: string
  state: QuoteState
  version: number
  threadId: string
  submittedAt: string
}

export type ContactShareState =
  | "not_requested"
  | "requested"
  | "one_side_approved"
  | "mutually_approved"
  | "revoked"

export interface ThreadOtherParty {
  displayName: string
  role: string
  profileId?: string | null
}

export interface ThreadLastMessage {
  messageId: string
  senderUserId: string
  body?: string | null
  hasAttachments: boolean
  createdAt: string
}

export interface ThreadSummary {
  threadId: string
  requestId: string
  requestTitle: string
  otherParty: ThreadOtherParty
  unreadCount: number
  contactShareState: ContactShareState
  lastMessage?: ThreadLastMessage | null
  createdAt: string
  updatedAt: string
}

export interface ThreadAttachment {
  attachmentId: string
  fileName: string
  contentType: string
  fileSize: number
  url: string
  createdAt: string
}

export interface ThreadMessage {
  messageId: string
  senderUserId: string
  senderType: string
  body?: string | null
  attachments: ThreadAttachment[]
  createdAt: string
}

export interface ThreadDetail {
  threadId: string
  requestId: string
  requestTitle: string
  otherParty: ThreadOtherParty
  contactShareState: ContactShareState
  contactShareRequestedByRole?: "requester" | "supplier" | null
  requesterApproved: boolean
  supplierApproved: boolean
  sharedContact?: ThreadSharedContact | null
  messages: ThreadMessage[]
  meta?: PaginationMeta
  createdAt: string
  updatedAt: string
}

export interface ThreadParticipantContact {
  name: string
  phone?: string | null
  email?: string | null
}

export interface ThreadSharedContact {
  requester: ThreadParticipantContact
  supplier: ThreadParticipantContact
}

export interface CreateThreadRequest {
  supplierId: string
}

export interface CreateThreadResponse {
  threadId: string
  requestId: string
  supplierProfileId: string
  createdAt: string
  created: boolean
}

export interface SendThreadMessageRequest {
  body?: string | null
  attachmentIds?: string[] | null
}

export interface SendThreadMessageResponse {
  messageId: string
  threadId: string
  createdAt: string
}

export interface MarkThreadReadResponse {
  threadId: string
  unreadCount: number
  readAt: string
}

export interface UploadThreadAttachmentResponse {
  attachmentId: string
  fileName: string
  contentType: string
  fileSize: number
  url: string
  createdAt: string
}

export interface ContactShareActionResponse {
  threadId: string
  contactShareState: ContactShareState
  requestedBy?: "requester" | "supplier" | null
  requestedAt?: string | null
  approvedAt?: string | null
  revokedAt?: string | null
  contactShareRequestedByRole?: "requester" | "supplier" | null
  requesterApproved: boolean
  supplierApproved: boolean
  sharedContact?: ThreadSharedContact | null
}

// ========================
// Notice Types (Task 11)
// ========================

export type NoticeState = "draft" | "published" | "archived"

export interface NoticeSummary {
  noticeId: string
  title: string
  excerpt: string
  state: NoticeState
  author: string
  authorId: string
  authorName?: string
  publishedAt: string | null
  viewCount: number
  createdAt: string
  updatedAt: string
}

export interface NoticeDetail {
  noticeId: string
  title: string
  body: string
  state: NoticeState
  authorId: string
  authorName?: string
  publishedAt: string | null
  viewCount: number
  attachments: NoticeAttachment[]
  createdAt: string
  updatedAt: string
}

export interface NoticeAttachment {
  attachmentId: string
  fileName: string
  contentType: string
  fileSize: number
  url: string
  createdAt: string
}

export interface CreateNoticeRequest {
  title: string
  body: string
  state?: NoticeState
  publishImmediately?: boolean
}

export interface CreateNoticeResponse {
  noticeId: string
  state: NoticeState
  createdAt: string
}

export interface UpdateNoticeRequest {
  title?: string
  body?: string
  state?: NoticeState
}

export interface UpdateNoticeResponse {
  noticeId: string
  state: NoticeState
  publishedAt?: string | null
  updatedAt: string
}

export interface PublishNoticeResponse {
  noticeId: string
  state: NoticeState
  publishedAt: string
}

export interface ArchiveNoticeResponse {
  noticeId: string
  state: NoticeState
  archivedAt: string
}

export interface PublicNoticeSummary {
  noticeId: string
  title: string
  excerpt: string
  publishedAt: string
}

export interface PublicNoticeDetail {
  noticeId: string
  title: string
  body: string
  publishedAt: string
  viewCount: number
  attachments: NoticeAttachment[]
}

// ========================
// Stats Types (Task 11)
// ========================

export interface AdminStatsSummary {
  users: UserStats
  suppliersByState: SuppliersByStateStats
  reviews: ReviewStats
  requests: RequestStats
  period: StatsPeriod
}

export interface UserStats {
  total: number
  requesters: number
  suppliers: number
  admins: number
}

export interface SuppliersByStateStats {
  approved: number
  submitted: number
  under_review: number
  hold: number
  rejected: number
  suspended: number
  draft: number
}

export interface ReviewStats {
  pending: number
  avgReviewDays: number
  totalReviewed: number
}

export interface RequestStats {
  open: number
  closed: number
  cancelled: number
  draft: number
  total: number
}

export interface StatsPeriod {
  from: string | null
  to: string | null
}

export interface GetStatsSummaryParams {
  fromDate?: string
  toDate?: string
}

// ---- Review (Task 06) ----
export type ReviewEligibilityReason = "request_not_closed" | "not_request_owner" | "no_selected_quote" | "already_reviewed"

export interface ReviewEligibility {
  eligible: boolean
  reason: ReviewEligibilityReason | null
}

export interface CreateReviewRequest {
  requestId: string
  supplierId: string
  rating: number
  text?: string | null
}

export interface UpdateReviewRequest {
  rating?: number | null
  text?: string | null
}

export interface CreateReviewResponse {
  reviewId: string
  rating: number
  text: string | null
  createdAt: string
}

export interface UpdateReviewResponse {
  reviewId: string
  rating: number
  text: string | null
  createdAt: string
  updatedAt: string
}

export interface SupplierReviewListItem {
  reviewId: string
  rating: number
  text: string | null
  authorDisplayName: string
  createdAt: string
  updatedAt: string
}

export interface SupplierRecentReview {
  reviewId: string
  rating: number
  text: string | null
  authorDisplayName: string
  createdAt: string
}
