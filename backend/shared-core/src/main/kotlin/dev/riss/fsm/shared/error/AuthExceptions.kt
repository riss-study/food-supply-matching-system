package dev.riss.fsm.shared.error

class EmailAlreadyExistsException(
    override val message: String = "Email already exists",
) : RuntimeException(message)

class InvalidCredentialsException(
    override val message: String = "Invalid credentials",
) : RuntimeException(message)

class PasswordEncodingException(
    override val message: String = "Password encoding failed",
) : RuntimeException(message)
