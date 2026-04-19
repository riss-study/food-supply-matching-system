package dev.riss.fsm.command.supplier

import dev.riss.fsm.shared.error.ApprovedSupplierProfileImmutableException
import dev.riss.fsm.shared.error.SupplierProfileAlreadyExistsException
import dev.riss.fsm.shared.error.SupplierProfileNotFoundException
import dev.riss.fsm.shared.error.SupplierProfileStateImmutableException
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.LocalDateTime
import java.util.UUID

@Service
class SupplierProfileCommandService(
    private val supplierProfileRepository: SupplierProfileRepository,
) {
    fun create(userId: String, request: CreateSupplierProfileCommand): Mono<SupplierProfileEntity> {
        return supplierProfileRepository.existsBySupplierUserId(userId)
            .flatMap { exists ->
                if (exists) {
                    Mono.error(SupplierProfileAlreadyExistsException())
                } else {
                    supplierProfileRepository.save(
                        SupplierProfileEntity(
                            profileId = "sprof_${UUID.randomUUID()}",
                            supplierUserId = userId,
                            companyName = request.companyName,
                            representativeName = request.representativeName,
                            contactPhone = request.contactPhone,
                            contactEmail = request.contactEmail,
                            region = request.region,
                            categories = request.categories.joinToString(","),
                            equipmentSummary = request.equipmentSummary,
                            monthlyCapacity = request.monthlyCapacity,
                            moq = request.moq,
                            oemAvailable = request.oemAvailable,
                            odmAvailable = request.odmAvailable,
                            rawMaterialSupport = request.rawMaterialSupport,
                            packagingLabelingSupport = request.packagingLabelingSupport,
                            introduction = request.introduction,
                            verificationState = "draft",
                            exposureState = "hidden",
                            createdAt = LocalDateTime.now(),
                            updatedAt = LocalDateTime.now(),
                        ).apply { newEntity = true },
                    )
                }
            }
    }

    fun update(userId: String, request: UpdateSupplierProfileCommand): Mono<SupplierProfileEntity> {
        return supplierProfileRepository.findBySupplierUserId(userId)
            .switchIfEmpty(Mono.error(SupplierProfileNotFoundException()))
            .flatMap { profile ->
                val contactOnlyUpdate =
                    request.companyName == null &&
                    request.representativeName == null &&
                    request.region == null &&
                    request.categories == null &&
                    request.equipmentSummary == null &&
                    request.monthlyCapacity == null &&
                    request.moq == null &&
                    request.oemAvailable == null &&
                    request.odmAvailable == null &&
                    request.rawMaterialSupport == null &&
                    request.packagingLabelingSupport == null &&
                    request.introduction == null &&
                    (request.contactPhone != null || request.contactEmail != null)

                if (profile.verificationState == "approved" && !contactOnlyUpdate) {
                    Mono.error(ApprovedSupplierProfileImmutableException())
                } else if (profile.verificationState !in setOf("draft", "hold", "rejected", "approved")) {
                    Mono.error(SupplierProfileStateImmutableException())
                } else {
                    supplierProfileRepository.save(
                        profile.copy(
                            companyName = request.companyName ?: profile.companyName,
                            representativeName = request.representativeName ?: profile.representativeName,
                            contactPhone = request.contactPhone ?: profile.contactPhone,
                            contactEmail = request.contactEmail ?: profile.contactEmail,
                            region = request.region ?: profile.region,
                            categories = request.categories?.joinToString(",") ?: profile.categories,
                            equipmentSummary = request.equipmentSummary ?: profile.equipmentSummary,
                            monthlyCapacity = request.monthlyCapacity ?: profile.monthlyCapacity,
                            moq = request.moq ?: profile.moq,
                            oemAvailable = request.oemAvailable ?: profile.oemAvailable,
                            odmAvailable = request.odmAvailable ?: profile.odmAvailable,
                            rawMaterialSupport = request.rawMaterialSupport ?: profile.rawMaterialSupport,
                            packagingLabelingSupport = request.packagingLabelingSupport ?: profile.packagingLabelingSupport,
                            introduction = request.introduction ?: profile.introduction,
                            updatedAt = LocalDateTime.now(),
                        )
                    )
                }
            }
    }
}

data class CreateSupplierProfileCommand(
    val companyName: String,
    val representativeName: String,
    val contactPhone: String?,
    val contactEmail: String?,
    val region: String,
    val categories: List<String>,
    val equipmentSummary: String?,
    val monthlyCapacity: String,
    val moq: String,
    val oemAvailable: Boolean,
    val odmAvailable: Boolean,
    val rawMaterialSupport: Boolean,
    val packagingLabelingSupport: Boolean,
    val introduction: String?,
)

data class UpdateSupplierProfileCommand(
    val companyName: String? = null,
    val representativeName: String? = null,
    val contactPhone: String? = null,
    val contactEmail: String? = null,
    val region: String? = null,
    val categories: List<String>? = null,
    val equipmentSummary: String? = null,
    val monthlyCapacity: String? = null,
    val moq: String? = null,
    val oemAvailable: Boolean? = null,
    val odmAvailable: Boolean? = null,
    val rawMaterialSupport: Boolean? = null,
    val packagingLabelingSupport: Boolean? = null,
    val introduction: String? = null,
)
