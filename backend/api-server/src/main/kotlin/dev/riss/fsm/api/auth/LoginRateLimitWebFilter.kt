package dev.riss.fsm.api.auth

import dev.riss.fsm.shared.security.SecurityErrorResponseWriter
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import org.springframework.web.server.ServerWebExchange
import org.springframework.web.server.WebFilter
import org.springframework.web.server.WebFilterChain
import reactor.core.publisher.Mono
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicBoolean

/**
 * 로그인 무차별 시도 차단.
 *
 * 같은 IP 가 짧은 시간에 401(잘못된 비밀번호) 또는 400(잘못된 요청 포맷) 을 N번 받으면
 * 일정 시간 동안 모든 시도를 429(요청 너무 많음) 로 차단.
 *
 * 정상 로그인(200)은 카운트 안 함 — 정상 사용자는 영향 없음.
 *
 * 메모리 기반 (단일 인스턴스 가정). 분산 배포 시에는 Redis 등 공용 저장소로 이전 필요.
 */
class LoginRateLimitWebFilter(
    private val maxFailures: Int = 10,
    private val windowSeconds: Long = 60,
    private val lockoutSeconds: Long = 60,
    /**
     * X-Forwarded-For 헤더를 신뢰할 수 있는 직전 hop(reverse proxy) 들의 IP 목록.
     * 비어있으면 XFF 헤더는 모두 무시 (직결 클라이언트는 위조 가능).
     * 운영에서는 nginx/CloudFront 등의 IP/CIDR 을 명시 (env: FSM_SECURITY_TRUSTED_PROXIES).
     */
    private val trustedProxies: Set<String> = emptySet(),
) : WebFilter {

    private val attempts = ConcurrentHashMap<String, AttemptRecord>()

    override fun filter(exchange: ServerWebExchange, chain: WebFilterChain): Mono<Void> {
        if (!isLoginRequest(exchange)) {
            return chain.filter(exchange)
        }

        val ip = clientIp(exchange)
        val now = Instant.now()
        val record = attempts.compute(ip) { _, existing ->
            (existing ?: AttemptRecord()).also { it.expireOldFailures(now, windowSeconds) }
        }!!

        if (record.lockedUntil != null && now.isBefore(record.lockedUntil)) {
            val secondsLeft = record.lockedUntil!!.epochSecond - now.epochSecond
            return SecurityErrorResponseWriter.write(
                exchange,
                HttpStatus.TOO_MANY_REQUESTS,
                4290,
                "Too many login attempts; retry in ${secondsLeft}s",
            )
        }

        // doFinally 가 reactor signal(complete + cancel) 마다 호출돼 하나의 요청이 두 번
        // 카운트되는 케이스를 막기 위한 가드.
        val counted = AtomicBoolean(false)
        return chain.filter(exchange).doFinally { _ ->
            if (!counted.compareAndSet(false, true)) return@doFinally
            val status = exchange.response.statusCode
            // 401(unauthorized 잘못된 비번) 또는 400(validation fail) 만 실패로 카운트.
            if (status == HttpStatus.UNAUTHORIZED || status == HttpStatus.BAD_REQUEST) {
                attempts.compute(ip) { _, existing ->
                    val rec = existing ?: AttemptRecord()
                    val nowAfter = Instant.now()
                    rec.expireOldFailures(nowAfter, windowSeconds)
                    rec.failures.add(nowAfter)
                    if (rec.failures.size >= maxFailures) {
                        rec.lockedUntil = nowAfter.plusSeconds(lockoutSeconds)
                        rec.failures.clear()
                    }
                    rec
                }
            }
        }
    }

    private fun isLoginRequest(exchange: ServerWebExchange): Boolean {
        return exchange.request.method == HttpMethod.POST &&
            exchange.request.path.value() == "/api/auth/login"
    }

    /**
     * 클라이언트 실제 IP 추출.
     * - 직전 hop(remoteAddress) 가 trustedProxies 안에 있을 때만 X-Forwarded-For 신뢰.
     * - XFF 는 "client, proxy1, proxy2" 형태 — 우측에서부터 trustedProxies 빼고 남는 마지막 토큰이 진짜 client.
     * - 신뢰 안 되는 직결 또는 trustedProxies 없으면 remoteAddress 그대로 사용 (XFF 무시).
     */
    private fun clientIp(exchange: ServerWebExchange): String {
        val remote = exchange.request.remoteAddress?.address?.hostAddress ?: "unknown"
        if (remote == "unknown" || remote !in trustedProxies) {
            return remote
        }
        val xff = exchange.request.headers.getFirst("X-Forwarded-For") ?: return remote
        val tokens = xff.split(",").map { it.trim() }.filter { it.isNotEmpty() }
        // 우측에서부터 trustedProxies 빼고 남는 마지막 토큰
        return tokens.lastOrNull { it !in trustedProxies } ?: remote
    }

    private class AttemptRecord {
        val failures: MutableList<Instant> = mutableListOf()
        var lockedUntil: Instant? = null

        fun expireOldFailures(now: Instant, windowSeconds: Long) {
            val cutoff = now.minusSeconds(windowSeconds)
            failures.removeAll { it.isBefore(cutoff) }
            if (lockedUntil != null && !now.isBefore(lockedUntil)) {
                lockedUntil = null
            }
        }
    }
}
