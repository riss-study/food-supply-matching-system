package dev.riss.fsm.admin.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity
import org.springframework.security.config.web.server.ServerHttpSecurity
import org.springframework.security.web.server.SecurityWebFilterChain

@Configuration
@EnableWebFluxSecurity
class AdminSecurityConfig {

    @Bean
    fun adminSecurityFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
        return http
            .csrf { it.disable() }
            .httpBasic { it.disable() }
            .formLogin { it.disable() }
            .authorizeExchange { exchanges ->
                exchanges
                    .pathMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**", "/api/admin/bootstrap/**", "/actuator/**").permitAll()
                    .anyExchange().permitAll()
            }
            .build()
    }
}
