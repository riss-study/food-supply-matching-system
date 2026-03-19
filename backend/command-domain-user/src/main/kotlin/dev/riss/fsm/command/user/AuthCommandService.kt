package dev.riss.fsm.command.user

import dev.riss.fsm.shared.auth.UserRole
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import java.time.LocalDateTime
import java.util.UUID

@Service
class AuthCommandService(
    private val userAccountRepository: UserAccountRepository,
    private val businessProfileRepository: BusinessProfileRepository,
    private val passwordEncoder: BCryptPasswordEncoder,
) {

    fun register(email: String, rawPassword: String, role: UserRole, businessName: String): Mono<UserAccountEntity> {
        return userAccountRepository.existsByEmail(email)
            .flatMap { exists ->
                if (exists) {
                    Mono.error(ResponseStatusException(HttpStatus.CONFLICT, "Email already exists"))
                } else {
                    val encodedPassword = passwordEncoder.encode(rawPassword)
                        ?: throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Password encoding failed")
                    val entity = UserAccountEntity(
                        userId = "usr_${UUID.randomUUID()}",
                        email = email,
                        passwordHash = encodedPassword,
                        role = role,
                        createdAt = LocalDateTime.now(),
                    ).apply { newEntity = true }
                    userAccountRepository.save(entity)
                        .flatMap { savedUser ->
                            if (role == UserRole.REQUESTER) {
                                businessProfileRepository.save(
                                    BusinessProfileEntity(
                                        profileId = "bprof_${UUID.randomUUID()}",
                                        userAccountId = savedUser.userId,
                                        businessName = businessName,
                                        businessRegistrationNumber = "",
                                        contactName = "",
                                        contactPhone = "",
                                        contactEmail = savedUser.email,
                                        verificationScope = "domestic",
                                        approvalState = "not_submitted",
                                        submittedAt = null,
                                        approvedAt = null,
                                        rejectedAt = null,
                                        rejectionReason = null,
                                        updatedAt = LocalDateTime.now(),
                                        createdAt = LocalDateTime.now(),
                                    ).apply { newEntity = true },
                                ).thenReturn(savedUser)
                            } else {
                                Mono.just(savedUser)
                            }
                        }
                }
            }
    }

    fun authenticate(email: String, rawPassword: String): Mono<UserAccountEntity> {
        return userAccountRepository.findByEmail(email)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials")))
            .flatMap { user ->
                if (passwordEncoder.matches(rawPassword, user.passwordHash)) {
                    Mono.just(user)
                } else {
                    Mono.error(ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"))
                }
            }
    }
}
