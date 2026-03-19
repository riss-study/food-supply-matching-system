package dev.riss.fsm.command.request

import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.LocalDateTime
import java.util.UUID

@Service
class RequestCommandService(
    private val requestRepository: RequestRepository,
) {
    fun create(command: CreateRequestCommand): Mono<RequestEntity> {
        val entity = RequestEntity(
            requestId = "req_${UUID.randomUUID()}",
            requesterUserId = command.requesterUserId,
            mode = command.mode,
            title = command.title,
            category = command.category,
            desiredVolume = command.desiredVolume,
            targetPriceMin = command.targetPriceMin,
            targetPriceMax = command.targetPriceMax,
            certificationRequirement = command.certificationRequirement?.joinToString(","),
            rawMaterialRule = command.rawMaterialRule,
            packagingRequirement = command.packagingRequirement,
            deliveryRequirement = command.deliveryRequirement,
            notes = command.notes,
            state = "draft",
            createdAt = LocalDateTime.now(),
        ).apply { newEntity = true }

        return requestRepository.save(entity)
    }
}

data class CreateRequestCommand(
    val requesterUserId: String,
    val mode: String,
    val title: String,
    val category: String,
    val desiredVolume: Int,
    val targetPriceMin: Int?,
    val targetPriceMax: Int?,
    val certificationRequirement: List<String>?,
    val rawMaterialRule: String?,
    val packagingRequirement: String?,
    val deliveryRequirement: String?,
    val notes: String?,
)
