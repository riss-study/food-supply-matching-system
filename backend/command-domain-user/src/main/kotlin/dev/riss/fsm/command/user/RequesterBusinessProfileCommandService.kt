package dev.riss.fsm.command.user

import dev.riss.fsm.shared.error.ApprovedBusinessProfileImmutableException
import dev.riss.fsm.shared.error.BusinessProfileAlreadySubmittedException
import dev.riss.fsm.shared.error.BusinessProfileNotFoundException
import dev.riss.fsm.shared.error.BusinessProfilePartialUpdateNotAllowedException
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.LocalDateTime

@Service
class RequesterBusinessProfileCommandService(
    private val businessProfileRepository: BusinessProfileRepository,
) {

    fun submit(userId: String, request: SubmitBusinessProfileCommand): Mono<BusinessProfileEntity> {
        return businessProfileRepository.findByUserAccountId(userId)
            .switchIfEmpty(Mono.error(BusinessProfileNotFoundException()))
            .flatMap { profile ->
                if (profile.approvalState == "submitted" || profile.approvalState == "approved") {
                    Mono.error(BusinessProfileAlreadySubmittedException())
                } else {
                    businessProfileRepository.save(
                        profile.copy(
                            businessName = request.businessName,
                            businessRegistrationNumber = request.businessRegistrationNumber,
                            contactName = request.contactName,
                            contactPhone = request.contactPhone,
                            contactEmail = request.contactEmail,
                            verificationScope = request.verificationScope,
                            approvalState = "submitted",
                            submittedAt = LocalDateTime.now(),
                            rejectedAt = null,
                            rejectionReason = null,
                            updatedAt = LocalDateTime.now(),
                        )
                    )
                }
            }
    }

    fun update(userId: String, request: UpdateBusinessProfileCommand): Mono<BusinessProfileEntity> {
        return businessProfileRepository.findByUserAccountId(userId)
            .switchIfEmpty(Mono.error(BusinessProfileNotFoundException()))
            .flatMap { profile ->
                if (profile.approvalState == "approved") {
                    Mono.error(ApprovedBusinessProfileImmutableException())
                } else if (profile.approvalState !in setOf("submitted", "rejected")) {
                    Mono.error(BusinessProfilePartialUpdateNotAllowedException())
                } else {
                    businessProfileRepository.save(
                        profile.copy(
                            businessName = request.businessName ?: profile.businessName,
                            businessRegistrationNumber = request.businessRegistrationNumber ?: profile.businessRegistrationNumber,
                            contactName = request.contactName ?: profile.contactName,
                            contactPhone = request.contactPhone ?: profile.contactPhone,
                            contactEmail = request.contactEmail ?: profile.contactEmail,
                            verificationScope = request.verificationScope ?: profile.verificationScope,
                            updatedAt = LocalDateTime.now(),
                        )
                    )
                }
            }
    }
}

data class SubmitBusinessProfileCommand(
    val businessName: String,
    val businessRegistrationNumber: String,
    val contactName: String,
    val contactPhone: String,
    val contactEmail: String,
    val verificationScope: String,
)

data class UpdateBusinessProfileCommand(
    val businessName: String? = null,
    val businessRegistrationNumber: String? = null,
    val contactName: String? = null,
    val contactPhone: String? = null,
    val contactEmail: String? = null,
    val verificationScope: String? = null,
)
