package dev.riss.fsm.command.supplier

import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Mono

interface SupplierProfileRepository : ReactiveCrudRepository<SupplierProfileEntity, String> {
    fun findBySupplierUserId(supplierUserId: String): Mono<SupplierProfileEntity>
    fun existsBySupplierUserId(supplierUserId: String): Mono<Boolean>
}

interface CertificationRecordRepository : ReactiveCrudRepository<CertificationRecordEntity, String> {
    fun findAllBySupplierProfileId(supplierProfileId: String): reactor.core.publisher.Flux<CertificationRecordEntity>
}

interface AttachmentMetadataRepository : ReactiveCrudRepository<AttachmentMetadataEntity, String> {
    fun findAllByOwnerTypeAndOwnerId(ownerType: String, ownerId: String): reactor.core.publisher.Flux<AttachmentMetadataEntity>
}

interface VerificationSubmissionRepository : ReactiveCrudRepository<VerificationSubmissionEntity, String> {
    fun findFirstBySupplierProfileIdOrderBySubmittedAtDesc(supplierProfileId: String): Mono<VerificationSubmissionEntity>
}

interface AuditLogRepository : ReactiveCrudRepository<AuditLogEntity, String> {
    fun findAllByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType: String, targetId: String): reactor.core.publisher.Flux<AuditLogEntity>
}
