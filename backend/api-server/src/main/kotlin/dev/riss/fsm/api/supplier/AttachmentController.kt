package dev.riss.fsm.api.supplier

import dev.riss.fsm.command.supplier.SupplierProfileRepository
import dev.riss.fsm.command.thread.MessageThreadRepository
import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.auth.UserRole
import dev.riss.fsm.shared.file.FileStorageService
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.http.codec.multipart.FilePart
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/attachments")
@Tag(name = "attachments")
@SecurityRequirement(name = "bearerAuth")
class AttachmentController(
    private val fileStorageService: FileStorageService,
    private val messageThreadRepository: MessageThreadRepository,
    private val supplierProfileRepository: SupplierProfileRepository,
) {

    /**
     * 임의의 owner_type/owner_id 를 클라이언트가 직접 지정하면 다른 사용자 자원에 첨부 우회 위험.
     * 허용된 ownerType 만 받고, 각 ownerType 별로 caller 가 그 자원의 정당한 주체인지 검증한다.
     *
     *  - thread: 해당 thread 의 참여자 (요청자 본인 또는 그 thread 의 supplier 본인).
     *  - supplier-verification: 인증 자료를 올리는 supplier 본인 (supplier_profile.id 의 소유자).
     *
     * ADMIN 은 통과 (운영 첨부 보정 용도).
     */
    private val ALLOWED_OWNER_TYPES = setOf("thread", "supplier-verification")

    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @Operation(summary = "Upload attachment", description = "Upload a generic attachment and return storage metadata")
    fun upload(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @RequestPart("ownerType") ownerType: String,
        @RequestPart("ownerId") ownerId: String,
        @RequestPart("file") file: FilePart,
    ): Mono<ResponseEntity<ApiSuccessResponse<AttachmentUploadResponse>>> {
        if (ownerType !in ALLOWED_OWNER_TYPES) {
            return Mono.error(ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported ownerType (allowed: $ALLOWED_OWNER_TYPES)"))
        }
        if (ownerId.isBlank() || ownerId.length > 64) {
            return Mono.error(ResponseStatusException(HttpStatus.BAD_REQUEST, "ownerId must be non-empty (max 64 chars)"))
        }

        return ensureOwnership(principal, ownerType, ownerId)
            .then(
                fileStorageService.store(ownerType, ownerId, file).map {
                    ResponseEntity.status(HttpStatus.CREATED).body(
                        ApiSuccessResponse(
                            message = "Attachment uploaded",
                            data = AttachmentUploadResponse(
                                attachmentId = it.attachmentId,
                                ownerType = it.ownerType,
                                ownerId = it.ownerId,
                                fileName = it.fileName,
                                contentType = it.contentType,
                                fileSize = it.fileSize,
                                storageKey = it.storageKey,
                                createdAt = it.createdAt,
                            )
                        )
                    )
                }
            )
    }

    private fun ensureOwnership(principal: AuthenticatedUserPrincipal, ownerType: String, ownerId: String): Mono<Unit> {
        if (principal.role == UserRole.ADMIN) return Mono.just(Unit)
        return when (ownerType) {
            "thread" -> messageThreadRepository.findById(ownerId)
                .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found")))
                .flatMap { thread ->
                    if (thread.requesterUserId == principal.userId) {
                        Mono.just(Unit)
                    } else if (principal.role == UserRole.SUPPLIER) {
                        // supplier 본인 thread 인지 확인: caller 의 supplier_profile.id 가 thread.supplierProfileId 와 일치
                        supplierProfileRepository.findBySupplierUserId(principal.userId)
                            .filter { it.profileId == thread.supplierProfileId }
                            .map { Unit }
                            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant of this thread")))
                    } else {
                        Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant of this thread"))
                    }
                }
            "supplier-verification" -> supplierProfileRepository.findById(ownerId)
                .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier profile not found")))
                .flatMap { profile ->
                    if (profile.supplierUserId == principal.userId) {
                        Mono.just(Unit)
                    } else {
                        Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Not the owner of this supplier profile"))
                    }
                }
            else -> Mono.error(ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported ownerType"))
        }
    }
}
