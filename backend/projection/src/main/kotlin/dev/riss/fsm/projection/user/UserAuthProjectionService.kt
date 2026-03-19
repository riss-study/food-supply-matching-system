package dev.riss.fsm.projection.user

import dev.riss.fsm.query.user.UserMeDocument
import dev.riss.fsm.query.user.UserMeDocumentRepository
import dev.riss.fsm.shared.auth.UserRole
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.Instant

@Service
class UserAuthProjectionService(
    private val userMeDocumentRepository: UserMeDocumentRepository,
) {

    fun projectSignedUpUser(
        userId: String,
        email: String,
        role: UserRole,
        businessApprovalState: String?,
        createdAt: Instant,
    ): Mono<UserMeDocument> {
        return userMeDocumentRepository.save(
            UserMeDocument(
                userId = userId,
                email = email,
                role = role,
                businessApprovalState = businessApprovalState,
                createdAt = createdAt,
            ),
        )
    }
}
