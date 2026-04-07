package dev.riss.fsm.api.config

import dev.riss.fsm.shared.security.JwtAuthenticationWebFilter
import dev.riss.fsm.shared.security.JwtTokenProvider
import dev.riss.fsm.shared.security.SecurityErrorResponseWriter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.reactive.CorsConfigurationSource
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity
import org.springframework.security.config.web.server.ServerHttpSecurity
import org.springframework.security.config.web.server.SecurityWebFiltersOrder
import org.springframework.security.web.server.SecurityWebFilterChain
import org.springframework.http.HttpStatus

@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
class ApiSecurityConfig(
    @org.springframework.beans.factory.annotation.Value("\${fsm.cors.allowed-origins:http://localhost:5173,http://localhost:5174}")
    private val allowedOrigins: String,
) {

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration().apply {
            this.allowedOrigins = this@ApiSecurityConfig.allowedOrigins.split(",").map { it.trim() }
            allowedMethods = listOf("GET", "POST", "PATCH", "DELETE", "OPTIONS")
            allowedHeaders = listOf("Authorization", "Content-Type", "Accept")
            allowCredentials = true
        }
        return UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/**", configuration)
        }
    }

    @Bean
    fun jwtAuthenticationWebFilter(jwtTokenProvider: JwtTokenProvider): JwtAuthenticationWebFilter {
        return JwtAuthenticationWebFilter(jwtTokenProvider)
    }

    @Bean
    fun apiSecurityFilterChain(http: ServerHttpSecurity, jwtAuthenticationWebFilter: JwtAuthenticationWebFilter): SecurityWebFilterChain {
        return http
            .csrf { it.disable() }
            .cors { }
            .httpBasic { it.disable() }
            .formLogin { it.disable() }
            .exceptionHandling {
                it.authenticationEntryPoint { exchange, _ ->
                    SecurityErrorResponseWriter.write(exchange, HttpStatus.UNAUTHORIZED, 4010, "Authentication required")
                }
                it.accessDeniedHandler { exchange, _ ->
                    SecurityErrorResponseWriter.write(exchange, HttpStatus.FORBIDDEN, 4030, "Access denied")
                }
            }
            .authorizeExchange { exchanges ->
                exchanges
                    .pathMatchers("/swagger-ui.html", "/swagger-ui/**", "/webjars/swagger-ui/**", "/v3/api-docs/**", "/api/bootstrap/**", "/actuator/**", "/api/auth/signup", "/api/auth/login", "/api/suppliers", "/api/suppliers/**", "/api/notices", "/api/notices/**").permitAll()
                    .anyExchange().authenticated()
            }
            .addFilterAt(jwtAuthenticationWebFilter, SecurityWebFiltersOrder.AUTHENTICATION)
            .build()
    }
}
