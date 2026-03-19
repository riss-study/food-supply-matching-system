package dev.riss.fsm.command.user

import dev.riss.fsm.shared.auth.UserRole
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Transient
import org.springframework.data.domain.Persistable
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.LocalDateTime

@Table("user_account")
data class UserAccountEntity(
    @Id
    @Column("id")
    val userId: String,
    @Column("email")
    val email: String,
    @Column("password_hash")
    val passwordHash: String,
    @Column("role")
    val role: UserRole,
    @Column("created_at")
    val createdAt: LocalDateTime,
) : Persistable<String> {
    @Transient
    var newEntity: Boolean = false

    override fun getId(): String = userId

    override fun isNew(): Boolean = newEntity
}
