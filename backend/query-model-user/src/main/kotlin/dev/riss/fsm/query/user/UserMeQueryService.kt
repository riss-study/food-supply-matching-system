package dev.riss.fsm.query.user

import org.springframework.stereotype.Service
import reactor.core.publisher.Mono

@Service
class UserMeQueryService(
    private val userMeDocumentRepository: UserMeDocumentRepository,
) {

    fun findMe(userId: String): Mono<UserMeView> {
        return userMeDocumentRepository.findById(userId)
            .map { document ->
                UserMeView(
                    userId = document.userId,
                    email = document.email,
                    role = document.role,
                    businessApprovalState = document.businessApprovalState,
                    createdAt = document.createdAt.atOffset(java.time.ZoneOffset.UTC).toLocalDateTime(),
                )
            }
    }
}
