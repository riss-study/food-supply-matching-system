package dev.riss.fsm.api.auth

import dev.riss.fsm.command.user.BusinessProfileRepository
import dev.riss.fsm.command.user.UserAccountRepository
import dev.riss.fsm.shared.auth.UserRole
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.LocalDateTime

/**
 * MariaDB 직접 조회 기반 사용자 프로필 뷰.
 * CQRS 롤백 (Phase 3 Task A, Stage 5) 이후 Mongo UserMeView 를 대체.
 */
data class UserMeView(
    val userId: String,
    val email: String,
    val role: UserRole,
    val businessApprovalState: String?,
    val createdAt: LocalDateTime,
)

@Service
class UserMeService(
    private val userAccountRepository: UserAccountRepository,
    private val businessProfileRepository: BusinessProfileRepository,
) {
    fun findMe(userId: String): Mono<UserMeView> {
        return userAccountRepository.findById(userId)
            .flatMap { account ->
                if (account.role == UserRole.REQUESTER) {
                    businessProfileRepository.findByUserAccountId(userId)
                        .map { profile -> toView(account, profile.approvalState) }
                        .defaultIfEmpty(toView(account, "not_submitted"))
                } else {
                    Mono.just(toView(account, null))
                }
            }
    }

    private fun toView(
        account: dev.riss.fsm.command.user.UserAccountEntity,
        businessApprovalState: String?,
    ): UserMeView = UserMeView(
        userId = account.userId,
        email = account.email,
        role = account.role,
        businessApprovalState = businessApprovalState,
        createdAt = account.createdAt,
    )
}
