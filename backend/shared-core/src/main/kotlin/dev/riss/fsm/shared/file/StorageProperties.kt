package dev.riss.fsm.shared.file

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "fsm.storage")
data class StorageProperties(
    val localRoot: String = "backend/local-storage",
)
