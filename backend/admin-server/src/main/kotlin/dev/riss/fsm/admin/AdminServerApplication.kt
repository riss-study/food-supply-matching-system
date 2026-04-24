package dev.riss.fsm.admin

import dev.riss.fsm.shared.file.StorageProperties
import dev.riss.fsm.shared.security.JwtProperties
import dev.riss.fsm.shared.security.JwtTokenProvider
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.boot.runApplication
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories

@SpringBootApplication(scanBasePackages = ["dev.riss.fsm"])
@EnableConfigurationProperties(JwtProperties::class, StorageProperties::class)
@EnableR2dbcRepositories(basePackages = ["dev.riss.fsm.command"])
class AdminServerApplication {
    @Bean
    fun jwtTokenProvider(properties: JwtProperties): JwtTokenProvider = JwtTokenProvider(properties)
}

fun main(args: Array<String>) {
    runApplication<AdminServerApplication>(*args)
}
