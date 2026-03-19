package dev.riss.fsm.shared.file

import java.time.Instant

data class AttachmentMetadata(
    val attachmentId: String,
    val ownerType: String,
    val ownerId: String,
    val fileName: String,
    val contentType: String,
    val fileSize: Long,
    val storageKey: String,
    val createdAt: Instant,
)
