package dev.riss.fsm.admin

import dev.riss.fsm.shared.security.JwtProperties
import dev.riss.fsm.shared.security.JwtTokenProvider
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.boot.runApplication

@SpringBootApplication(scanBasePackages = ["dev.riss.fsm"])
@EnableConfigurationProperties(JwtProperties::class)
class AdminServerApplication {
    @Bean
    fun jwtTokenProvider(properties: JwtProperties): JwtTokenProvider = JwtTokenProvider(properties)
}

fun main(args: Array<String>) {
    runApplication<AdminServerApplication>(*args)
}
