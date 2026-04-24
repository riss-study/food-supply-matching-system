package dev.riss.fsm.api.supplier

import dev.riss.fsm.command.supplier.CertificationRecordEntity
import dev.riss.fsm.command.supplier.CertificationRecordRepository
import dev.riss.fsm.command.supplier.CreateSupplierProfileCommand
import dev.riss.fsm.command.supplier.AttachmentMetadataEntity
import dev.riss.fsm.command.supplier.AttachmentMetadataRepository
import dev.riss.fsm.command.supplier.SupplierProfileCommandService
import dev.riss.fsm.command.supplier.SupplierProfileEntity
import dev.riss.fsm.command.supplier.SupplierProfileRepository
import dev.riss.fsm.command.supplier.UpdateSupplierProfileCommand
import dev.riss.fsm.command.supplier.VerificationSubmissionEntity
import dev.riss.fsm.command.supplier.VerificationSubmissionRepository
import dev.riss.fsm.shared.auth.UserRole
import dev.riss.fsm.shared.file.FileStorageService
import dev.riss.fsm.shared.file.AttachmentMetadata
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.springframework.http.HttpStatus
import org.springframework.http.codec.multipart.FilePart
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.util.UUID

@Service
class SupplierProfileApplicationService(
    private val supplierProfileCommandService: SupplierProfileCommandService,
    private val supplierProfileRepository: SupplierProfileRepository,
    private val verificationSubmissionRepository: VerificationSubmissionRepository,
    private val certificationRecordRepository: CertificationRecordRepository,
    private val attachmentMetadataRepository: AttachmentMetadataRepository,
    private val fileStorageService: FileStorageService,
) {

    fun create(principal: AuthenticatedUserPrincipal, request: CreateSupplierProfileRequest): Mono<SupplierProfileResponse> {
        ensureSupplier(principal)
        return supplierProfileCommandService.create(
            principal.userId,
            CreateSupplierProfileCommand(
                companyName = request.companyName,
                representativeName = request.representativeName,
                contactPhone = request.contactPhone,
                contactEmail = request.contactEmail,
                region = request.region,
                categories = request.categories,
                equipmentSummary = request.equipmentSummary,
                monthlyCapacity = request.monthlyCapacity,
                moq = request.moq,
                oemAvailable = request.oemAvailable,
                odmAvailable = request.odmAvailable,
                rawMaterialSupport = request.rawMaterialSupport,
                packagingLabelingSupport = request.packagingLabelingSupport,
                introduction = request.introduction,
            ),
        ).flatMap { profile -> toResponse(profile) }
    }

    fun get(principal: AuthenticatedUserPrincipal): Mono<SupplierProfileResponse> {
        ensureSupplier(principal)
        return supplierProfileRepository.findBySupplierUserId(principal.userId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier profile not found")))
            .flatMap { toResponse(it) }
    }

    fun update(principal: AuthenticatedUserPrincipal, request: UpdateSupplierProfileRequest): Mono<SupplierProfileResponse> {
        ensureSupplier(principal)
        return supplierProfileCommandService.update(
            principal.userId,
            UpdateSupplierProfileCommand(
                companyName = request.companyName,
                representativeName = request.representativeName,
                contactPhone = request.contactPhone,
                contactEmail = request.contactEmail,
                region = request.region,
                categories = request.categories,
                equipmentSummary = request.equipmentSummary,
                monthlyCapacity = request.monthlyCapacity,
                moq = request.moq,
                oemAvailable = request.oemAvailable,
                odmAvailable = request.odmAvailable,
                rawMaterialSupport = request.rawMaterialSupport,
                packagingLabelingSupport = request.packagingLabelingSupport,
                introduction = request.introduction,
            ),
        ).flatMap { toResponse(it) }
    }

    fun submitVerification(
        principal: AuthenticatedUserPrincipal,
        businessRegistrationDoc: FilePart,
        certifications: List<FilePart>,
        portfolioImages: List<FilePart>,
    ): Mono<VerificationSubmissionResponse> {
        ensureSupplier(principal)
        return supplierProfileRepository.findBySupplierUserId(principal.userId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Supplier profile must exist before submission")))
            .flatMap { profile ->
                verificationSubmissionRepository.findFirstBySupplierProfileIdOrderBySubmittedAtDesc(profile.profileId)
                    .flatMap<VerificationSubmissionResponse> { existing ->
                        if (existing.state == "submitted" || existing.state == "under_review") {
                            Mono.error(ResponseStatusException(HttpStatus.CONFLICT, "Verification submission already in progress"))
                        } else {
                            Mono.empty()
                        }
                    }
                    .switchIfEmpty(
                        storeVerificationFiles(profile.profileId, businessRegistrationDoc, certifications, portfolioImages)
                            .collectList()
                            .flatMap { files ->
                                val submission = VerificationSubmissionEntity(
                                    submissionId = "vsub_${UUID.randomUUID()}",
                                    supplierProfileId = profile.profileId,
                                    state = "submitted",
                                    submittedAt = LocalDateTime.now(),
                                    reviewedAt = null,
                                    reviewedBy = null,
                                    reviewNoteInternal = null,
                                    reviewNotePublic = null,
                                ).apply { newEntity = true }
                                verificationSubmissionRepository.save(submission)
                                    .flatMap {
                                        supplierProfileRepository.save(
                                            profile.copy(
                                                verificationState = "submitted",
                                                updatedAt = LocalDateTime.now(),
                                            )
                                        )
                                    }
                                    .map { updatedProfile ->
                                        VerificationSubmissionResponse(
                                            submissionId = submission.submissionId,
                                            state = updatedProfile.verificationState,
                                            submittedAt = submission.submittedAt.toInstant(ZoneOffset.UTC),
                                            fileCount = files.size,
                                        )
                                    }
                            }
                    )
            }
    }

    fun latestVerification(principal: AuthenticatedUserPrincipal): Mono<LatestVerificationSubmissionResponse> {
        ensureSupplier(principal)
        return supplierProfileRepository.findBySupplierUserId(principal.userId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier profile not found")))
            .flatMap { profile ->
                verificationSubmissionRepository.findFirstBySupplierProfileIdOrderBySubmittedAtDesc(profile.profileId)
                    .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Verification submission not found")))
                    .flatMap { submission ->
                        certificationRecordRepository.findAllBySupplierProfileId(profile.profileId)
                            .map {
                                VerificationFileItem(
                                    fileId = it.fileAttachmentId,
                                    fileName = it.number ?: it.type,
                                    status = it.status,
                                )
                            }
                            .collectList()
                            .map { files ->
                                LatestVerificationSubmissionResponse(
                                    submissionId = submission.submissionId,
                                    state = submission.state,
                                    submittedAt = submission.submittedAt.toInstant(ZoneOffset.UTC),
                                    reviewedAt = submission.reviewedAt?.toInstant(ZoneOffset.UTC),
                                    reviewNotePublic = submission.reviewNotePublic,
                                    files = files,
                                )
                            }
                    }
            }
    }

    private fun ensureSupplier(principal: AuthenticatedUserPrincipal) {
        if (principal.role != UserRole.SUPPLIER) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Only supplier accounts can access this endpoint")
        }
    }

    private fun toResponse(profile: SupplierProfileEntity): Mono<SupplierProfileResponse> {
        return zipProfileAssets(profile.profileId)
            .map { (certs, attachments) ->
                SupplierProfileResponse(
                    profileId = profile.profileId,
                    companyName = profile.companyName,
                    representativeName = profile.representativeName,
                    contactPhone = profile.contactPhone,
                    contactEmail = profile.contactEmail,
                    region = profile.region,
                    categories = profile.categories.split(',').filter { it.isNotBlank() },
                    equipmentSummary = profile.equipmentSummary,
                    monthlyCapacity = profile.monthlyCapacity,
                    moq = profile.moq,
                    oemAvailable = profile.oemAvailable,
                    odmAvailable = profile.odmAvailable,
                    rawMaterialSupport = profile.rawMaterialSupport,
                    packagingLabelingSupport = profile.packagingLabelingSupport,
                    introduction = profile.introduction,
                    verificationState = profile.verificationState,
                    exposureState = profile.exposureState,
                    certifications = certs.map {
                        CertificationRecordResponse(
                            recordId = it.recordId,
                            type = it.type,
                            number = it.number,
                            fileAttachmentId = it.fileAttachmentId,
                            status = it.status,
                        )
                    },
                    createdAt = profile.createdAt.toInstant(ZoneOffset.UTC),
                    updatedAt = profile.updatedAt.toInstant(ZoneOffset.UTC),
                )
            }
    }

    private fun storeVerificationFiles(
        profileId: String,
        businessRegistrationDoc: FilePart,
        certifications: List<FilePart>,
        portfolioImages: List<FilePart>,
    ): Flux<AttachmentMetadata> {
        val all = mutableListOf<Pair<String, FilePart>>()
        all += "businessRegistrationDoc" to businessRegistrationDoc
        certifications.forEach { all += "certification" to it }
        portfolioImages.forEach { all += "portfolio" to it }

        return Flux.fromIterable(all)
            .flatMap { (type, file) ->
                fileStorageService.store("supplier-verification", profileId, file)
                    .flatMap { metadata ->
                        attachmentMetadataRepository.save(
                            AttachmentMetadataEntity(
                                attachmentId = metadata.attachmentId,
                                ownerType = metadata.ownerType,
                                ownerId = metadata.ownerId,
                                attachmentKind = type,
                                fileName = metadata.fileName,
                                contentType = metadata.contentType,
                                fileSize = metadata.fileSize,
                                storageKey = metadata.storageKey,
                                createdAt = LocalDateTime.now(),
                            ).apply { newEntity = true }
                        ).then(
                        if (type == "businessRegistrationDoc" || type == "certification") {
                            certificationRecordRepository.save(
                                CertificationRecordEntity(
                                    recordId = "cert_${UUID.randomUUID()}",
                                    supplierProfileId = profileId,
                                    type = type,
                                    number = metadata.fileName,
                                    fileAttachmentId = metadata.attachmentId,
                                    status = "submitted",
                                    createdAt = LocalDateTime.now(),
                                ).apply { newEntity = true }
                            ).thenReturn(metadata)
                        } else {
                            Mono.just(metadata)
                        })
                    }
            }
    }

    private fun zipProfileAssets(profileId: String): Mono<Pair<List<CertificationRecordEntity>, List<AttachmentMetadataEntity>>> {
        val certsMono = certificationRecordRepository.findAllBySupplierProfileId(profileId).collectList()
        val attachmentsMono = attachmentMetadataRepository.findAllByOwnerTypeAndOwnerId("supplier-verification", profileId).collectList()
        return Mono.zip(certsMono, attachmentsMono).map { it.t1 to it.t2 }
    }

}
