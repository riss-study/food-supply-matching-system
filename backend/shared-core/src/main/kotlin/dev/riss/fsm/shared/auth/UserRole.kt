package dev.riss.fsm.shared.auth

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonValue

enum class UserRole(
    private val key: String,
) {
    REQUESTER("requester"),
    SUPPLIER("supplier"),
    ADMIN("admin"),
    ;

    @JsonValue
    fun key(): String = key

    fun authority(): String = "ROLE_${name}"

    companion object {
        @JsonCreator
        @JvmStatic
        fun fromKey(value: String): UserRole {
            return entries.firstOrNull { it.key.equals(value, ignoreCase = true) || it.name.equals(value, ignoreCase = true) }
                ?: throw IllegalArgumentException("Unsupported role: $value")
        }
    }
}
