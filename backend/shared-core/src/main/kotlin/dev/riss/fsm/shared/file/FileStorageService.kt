package dev.riss.fsm.shared.file

import org.springframework.http.codec.multipart.FilePart
import reactor.core.publisher.Mono
import java.nio.file.Path

interface FileStorageService {
    fun store(ownerType: String, ownerId: String, filePart: FilePart): Mono<AttachmentMetadata>
    fun resolve(storageKey: String): Mono<Path>
}
