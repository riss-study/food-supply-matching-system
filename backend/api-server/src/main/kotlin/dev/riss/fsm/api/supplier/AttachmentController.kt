package dev.riss.fsm.api.supplier

import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.file.FileStorageService
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.constraints.Pattern
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.http.codec.multipart.FilePart
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/attachments")
@Tag(name = "attachments")
@SecurityRequirement(name = "bearerAuth")
class AttachmentController(
    private val fileStorageService: FileStorageService,
) {

    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @Operation(summary = "Upload attachment", description = "Upload a generic attachment and return storage metadata")
    fun upload(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @RequestPart("ownerType") ownerType: String,
        @RequestPart("ownerId") ownerId: String,
        @RequestPart("file") file: FilePart,
    ): Mono<ResponseEntity<ApiSuccessResponse<AttachmentUploadResponse>>> {
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
