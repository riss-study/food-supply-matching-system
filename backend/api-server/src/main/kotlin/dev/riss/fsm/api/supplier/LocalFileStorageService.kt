package dev.riss.fsm.api.supplier

import dev.riss.fsm.shared.file.AttachmentMetadata
import dev.riss.fsm.shared.file.FileStorageService
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.codec.multipart.FilePart
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import java.nio.file.Files
import java.nio.file.Path
import java.time.Instant
import java.util.UUID

@Service
class LocalFileStorageService(
    @Value("\${fsm.storage.local-root:backend/local-storage}") private val localRoot: String,
) : FileStorageService {
    private val allowedContentTypes = setOf("image/jpeg", "image/png", "application/pdf")
    private val maxFileSize = 10L * 1024 * 1024

    override fun store(ownerType: String, ownerId: String, filePart: FilePart): Mono<AttachmentMetadata> {
        val contentType = filePart.headers().contentType?.toString() ?: "application/octet-stream"
        if (contentType !in allowedContentTypes) {
            return Mono.error(ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported file type"))
        }

        val declaredLength = filePart.headers().contentLength
        if (declaredLength > maxFileSize) {
            return Mono.error(ResponseStatusException(HttpStatus.BAD_REQUEST, "File size exceeds 10MB"))
        }

        val attachmentId = "att_${UUID.randomUUID()}"
        val sanitized = filePart.filename().replace(Regex("[^A-Za-z0-9._-]"), "_")
        val storageKey = "$ownerType/$ownerId/$attachmentId-$sanitized"
        val target = Path.of(localRoot, storageKey)
        Files.createDirectories(target.parent)

        return filePart.transferTo(target).then(
            Mono.fromCallable {
                val size = Files.size(target)
                if (size > maxFileSize) {
                    Files.deleteIfExists(target)
                    throw ResponseStatusException(HttpStatus.BAD_REQUEST, "File size exceeds 10MB")
                }
                AttachmentMetadata(
                    attachmentId = attachmentId,
                    ownerType = ownerType,
                    ownerId = ownerId,
                    fileName = filePart.filename(),
                    contentType = contentType,
                    fileSize = size,
                    storageKey = storageKey,
                    createdAt = Instant.now(),
                )
            }
        )
    }
}
