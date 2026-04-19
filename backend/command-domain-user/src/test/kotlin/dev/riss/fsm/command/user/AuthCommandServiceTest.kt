package dev.riss.fsm.command.user

import dev.riss.fsm.shared.auth.UserRole
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.any
import org.mockito.Mockito.`when`
import dev.riss.fsm.shared.error.EmailAlreadyExistsException
import dev.riss.fsm.shared.error.InvalidCredentialsException
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import reactor.core.publisher.Mono
import java.time.LocalDateTime

class AuthCommandServiceTest {

    private val userAccountRepository = mock(UserAccountRepository::class.java)
    private val businessProfileRepository = mock(BusinessProfileRepository::class.java)
    private val passwordEncoder = BCryptPasswordEncoder()
    private val service = AuthCommandService(userAccountRepository, businessProfileRepository, passwordEncoder)

    @Test
    fun `register creates account when email is available`() {
        `when`(userAccountRepository.existsByEmail("new@example.com")).thenReturn(Mono.just(false))
        `when`(userAccountRepository.save(any(UserAccountEntity::class.java))).thenAnswer { invocation ->
            Mono.just(invocation.arguments[0] as UserAccountEntity)
        }

        `when`(businessProfileRepository.save(any(BusinessProfileEntity::class.java))).thenAnswer { invocation ->
            Mono.just(invocation.arguments[0] as BusinessProfileEntity)
        }

        val result = service.register("new@example.com", "SecurePass123!", UserRole.REQUESTER, "Example Foods").block()

        assertNotNull(result)
        assertEquals("new@example.com", result?.email)
        assertEquals(UserRole.REQUESTER, result?.role)
    }

    @Test
    fun `register rejects duplicate email`() {
        `when`(userAccountRepository.existsByEmail("dup@example.com")).thenReturn(Mono.just(true))

        assertThrows(EmailAlreadyExistsException::class.java) {
            service.register("dup@example.com", "SecurePass123!", UserRole.SUPPLIER, "Example Supplier").block()
        }
    }

    @Test
    fun `authenticate rejects invalid password`() {
        val user = UserAccountEntity(
            userId = "usr_test",
            email = "user@example.com",
            passwordHash = passwordEncoder.encode("SecurePass123!")!!,
            role = UserRole.REQUESTER,
            createdAt = LocalDateTime.now(),
        )
        `when`(userAccountRepository.findByEmail("user@example.com")).thenReturn(Mono.just(user))

        assertThrows(InvalidCredentialsException::class.java) {
            service.authenticate("user@example.com", "wrong-password").block()
        }
    }
}
