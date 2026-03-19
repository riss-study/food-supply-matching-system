package dev.riss.fsm.projection.user

import dev.riss.fsm.command.user.BusinessProfileEntity
import dev.riss.fsm.query.user.RequesterBusinessProfileDocument
import dev.riss.fsm.query.user.RequesterBusinessProfileDocumentRepository
import dev.riss.fsm.query.user.UserMeDocument
import dev.riss.fsm.query.user.UserMeDocumentRepository
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.ZoneOffset

@Service
class RequesterBusinessProfileProjectionService(
    private val requesterBusinessProfileDocumentRepository: RequesterBusinessProfileDocumentRepository,
    private val userMeDocumentRepository: UserMeDocumentRepository,
) {

    fun project(profile: BusinessProfileEntity, email: String, role: dev.riss.fsm.shared.auth.UserRole): Mono<Void> {
        val profileDocument = RequesterBusinessProfileDocument(
            profileId = profile.profileId,
            userId = profile.userAccountId,
            businessName = profile.businessName,
            businessRegistrationNumber = profile.businessRegistrationNumber,
            contactName = profile.contactName,
            contactPhone = profile.contactPhone,
            contactEmail = profile.contactEmail,
            verificationScope = profile.verificationScope,
            approvalState = profile.approvalState,
            submittedAt = profile.submittedAt?.toInstant(ZoneOffset.UTC),
            approvedAt = profile.approvedAt?.toInstant(ZoneOffset.UTC),
            rejectedAt = profile.rejectedAt?.toInstant(ZoneOffset.UTC),
            rejectionReason = profile.rejectionReason,
            updatedAt = profile.updatedAt.toInstant(ZoneOffset.UTC),
        )

        val userMeDocument = UserMeDocument(
            userId = profile.userAccountId,
            email = email,
            role = role,
            businessApprovalState = profile.approvalState,
            createdAt = profile.createdAt.toInstant(ZoneOffset.UTC),
        )

        return requesterBusinessProfileDocumentRepository.save(profileDocument)
            .then(userMeDocumentRepository.save(userMeDocument))
            .then()
    }
}
