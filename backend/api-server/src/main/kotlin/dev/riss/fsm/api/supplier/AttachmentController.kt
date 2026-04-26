package dev.riss.fsm.api.supplier

import dev.riss.fsm.shared.api.ApiSuccessResponse
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
) {

    /**
     * 임의의 owner_type/owner_id 를 클라이언트가 직접 지정하면 다른 사용자 자원에 첨부 우회 위험.
     * 허용된 ownerType 만 받고, 각 ownerType 별 ownerId 의미를 controller 에서 검증.
     * 실제 owner 권한 검증은 도메인별 endpoint (예: /api/supplier/verification-submissions,
     * /api/threads/{id}/attachments) 가 책임. 본 generic 경로는 화이트리스트 만 적용.
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
        return fileStorageService.store(ownerType, ownerId, file)
            .map {
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
    }
}
