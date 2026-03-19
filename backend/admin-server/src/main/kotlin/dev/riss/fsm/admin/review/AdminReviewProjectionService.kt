package dev.riss.fsm.admin.review

import dev.riss.fsm.command.supplier.CertificationRecordRepository
import dev.riss.fsm.command.supplier.SupplierProfileEntity
import dev.riss.fsm.command.supplier.VerificationSubmissionEntity
import dev.riss.fsm.query.admin.review.AdminReviewDetailDocument
import dev.riss.fsm.query.admin.review.AdminReviewDetailViewRepository
import dev.riss.fsm.query.admin.review.AdminReviewFileItem
import dev.riss.fsm.query.admin.review.AdminReviewQueueItemDocument
import dev.riss.fsm.query.admin.review.AdminReviewQueueViewRepository
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.ZoneOffset
import java.time.temporal.ChronoUnit

@Service
class AdminReviewProjectionService(
    private val queueRepository: AdminReviewQueueViewRepository,
    private val detailRepository: AdminReviewDetailViewRepository,
    private val certificationRecordRepository: CertificationRecordRepository,
) {
    fun project(submission: VerificationSubmissionEntity, supplierProfile: SupplierProfileEntity): Mono<Void> {
        return certificationRecordRepository.findAllBySupplierProfileId(supplierProfile.profileId)
            .map {
                AdminReviewFileItem(
                    fileId = it.fileAttachmentId,
                    fileName = it.number ?: it.type,
                    status = it.status,
                )
            }
            .collectList()
            .flatMap { files ->
                val queueDocument = AdminReviewQueueItemDocument(
                    reviewId = submission.submissionId,
                    supplierProfileId = supplierProfile.profileId,
                    companyName = supplierProfile.companyName,
                    state = submission.state,
                    submittedAt = submission.submittedAt.toInstant(ZoneOffset.UTC),
                    pendingDays = ChronoUnit.DAYS.between(submission.submittedAt, java.time.LocalDateTime.now()),
                    verificationState = supplierProfile.verificationState,
                )

                val detailDocument = AdminReviewDetailDocument(
                    reviewId = submission.submissionId,
                    supplierProfileId = supplierProfile.profileId,
                    companyName = supplierProfile.companyName,
                    representativeName = supplierProfile.representativeName,
                    region = supplierProfile.region,
                    categories = supplierProfile.categories.split(',').filter { it.isNotBlank() },
                    state = submission.state,
                    submittedAt = submission.submittedAt.toInstant(ZoneOffset.UTC),
                    reviewedAt = submission.reviewedAt?.toInstant(ZoneOffset.UTC),
                    reviewNoteInternal = submission.reviewNoteInternal,
                    reviewNotePublic = submission.reviewNotePublic,
                    files = files,
                )

                queueRepository.save(queueDocument)
                    .then(detailRepository.save(detailDocument))
                    .then()
            }
    }
}
