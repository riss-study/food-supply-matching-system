package dev.riss.fsm.shared.security

import dev.riss.fsm.shared.auth.UserRole
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import org.springframework.web.server.ServerWebExchange
import org.springframework.web.server.WebFilter
import org.springframework.web.server.WebFilterChain
import reactor.core.publisher.Mono

class JwtAuthenticationWebFilter(
    private val jwtTokenProvider: JwtTokenProvider,
) : WebFilter {

    private val publicPrefixes = listOf(
        "/api/auth/",
        "/api/bootstrap/",
        "/api/admin/bootstrap/",
        "/api/suppliers",
        "/swagger-ui.html",
        "/swagger-ui/",
        "/webjars/swagger-ui/",
        "/v3/api-docs",
        "/actuator/",
    )

    override fun filter(exchange: ServerWebExchange, chain: WebFilterChain): Mono<Void> {
        if (isPublicPath(exchange)) {
            return chain.filter(exchange)
        }

        val authorization = exchange.request.headers.getFirst(HttpHeaders.AUTHORIZATION) ?: return chain.filter(exchange)
        if (!authorization.startsWith("Bearer ")) {
            return SecurityErrorResponseWriter.write(exchange, HttpStatus.UNAUTHORIZED, 4011, "Invalid authorization header")
        }

        val token = authorization.removePrefix("Bearer ").trim()
        if (token.isBlank()) {
            return SecurityErrorResponseWriter.write(exchange, HttpStatus.UNAUTHORIZED, 4011, "Empty bearer token")
        }

        return try {
            val claims = jwtTokenProvider.parseClaims(token)
            val subject = claims.subject ?: return SecurityErrorResponseWriter.write(exchange, HttpStatus.UNAUTHORIZED, 4011, "Missing token subject")
            val email = claims["email"]?.toString() ?: return SecurityErrorResponseWriter.write(exchange, HttpStatus.UNAUTHORIZED, 4011, "Missing token email")
            val role = UserRole.fromKey(claims["role"]?.toString() ?: return SecurityErrorResponseWriter.write(exchange, HttpStatus.UNAUTHORIZED, 4011, "Missing token role"))
            val principal = AuthenticatedUserPrincipal(userId = subject, email = email, role = role)
            val authentication = UsernamePasswordAuthenticationToken(
                principal,
                token,
                listOf(SimpleGrantedAuthority(role.authority())),
            )

            chain.filter(exchange).contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication))
        } catch (_: Exception) {
            SecurityErrorResponseWriter.write(exchange, HttpStatus.UNAUTHORIZED, 4011, "Invalid or expired token")
        }
    }

    private fun isPublicPath(exchange: ServerWebExchange): Boolean {
        if (exchange.request.method == HttpMethod.OPTIONS) {
            return true
        }

        val path = exchange.request.path.value()
        return publicPrefixes.any { prefix ->
            path == prefix.removeSuffix("/") || path.startsWith(prefix)
        }
    }
}
