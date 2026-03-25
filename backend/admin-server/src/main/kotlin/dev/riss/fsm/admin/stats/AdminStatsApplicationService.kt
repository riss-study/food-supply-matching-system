package dev.riss.fsm.admin.stats

import dev.riss.fsm.command.request.RequestRepository
import dev.riss.fsm.command.supplier.SupplierProfileRepository
import dev.riss.fsm.command.supplier.VerificationSubmissionRepository
import dev.riss.fsm.command.user.UserAccountRepository
import dev.riss.fsm.shared.auth.UserRole
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Service
class AdminStatsApplicationService(
    private val userAccountRepository: UserAccountRepository,
    private val supplierProfileRepository: SupplierProfileRepository,
    private val verificationSubmissionRepository: VerificationSubmissionRepository,
    private val requestRepository: RequestRepository,
) {

    fun getStatsSummary(
        principal: AuthenticatedUserPrincipal,
        fromDate: LocalDate?,
        toDate: LocalDate?,
    ): Mono<AdminStatsSummaryResponse> {
        return ensureAdmin(principal).then(
            Mono.defer {
                Mono.zip(
                    computeUserStats(fromDate, toDate),
                    computeSupplierStateStats(fromDate, toDate),
                    computeReviewStats(fromDate, toDate),
                    computeRequestStats(fromDate, toDate),
                ).map { tuple ->
                    AdminStatsSummaryResponse(
                        users = tuple.t1,
                        suppliersByState = tuple.t2,
                        reviews = tuple.t3,
                        requests = tuple.t4,
                        period = StatsPeriod(from = fromDate, to = toDate),
                    )
                }
            }
        )
    }

    private fun computeUserStats(fromDate: LocalDate?, toDate: LocalDate?): Mono<UsersStats> {
        return userAccountRepository.findAll()
            .collectList()
            .map { users ->
                val filtered = users.filter { withinPeriod(it.createdAt.toLocalDate(), fromDate, toDate) }
                val total = filtered.size.toLong()
                val requesters = filtered.count { it.role == UserRole.REQUESTER }.toLong()
                val suppliers = filtered.count { it.role == UserRole.SUPPLIER }.toLong()
                val admins = filtered.count { it.role == UserRole.ADMIN }.toLong()
                UsersStats(total = total, requesters = requesters, suppliers = suppliers, admins = admins)
            }
    }

    private fun computeSupplierStateStats(fromDate: LocalDate?, toDate: LocalDate?): Mono<SupplierStateStats> {
        return supplierProfileRepository.findAll()
            .collectList()
            .map { suppliers ->
                val filtered = suppliers.filter { withinPeriod(it.createdAt.toLocalDate(), fromDate, toDate) }
                SupplierStateStats(
                    approved = filtered.count { it.verificationState == "approved" }.toLong(),
                    submitted = filtered.count { it.verificationState == "submitted" }.toLong(),
                    underReview = filtered.count { it.verificationState == "under_review" }.toLong(),
                    hold = filtered.count { it.verificationState == "hold" }.toLong(),
                    rejected = filtered.count { it.verificationState == "rejected" }.toLong(),
                    suspended = filtered.count { it.verificationState == "suspended" }.toLong(),
                    draft = filtered.count { it.verificationState == "draft" }.toLong(),
                )
            }
    }

    private fun computeReviewStats(fromDate: LocalDate?, toDate: LocalDate?): Mono<ReviewStats> {
        return verificationSubmissionRepository.findAll()
            .collectList()
            .map { submissions ->
                val filtered = submissions.filter { withinPeriod(it.submittedAt.toLocalDate(), fromDate, toDate) }
                val pending = filtered.count { it.state == "submitted" || it.state == "under_review" || it.state == "hold" }.toLong()
                val reviewedSubmissions = filtered.filter { it.reviewedAt != null }
                val avgDays = if (reviewedSubmissions.isNotEmpty()) {
                    reviewedSubmissions.map { submission ->
                        ChronoUnit.DAYS.between(submission.submittedAt, submission.reviewedAt)
                    }.average()
                } else {
                    0.0
                }
                ReviewStats(pending = pending, avgReviewDays = avgDays, totalReviewed = reviewedSubmissions.size.toLong())
            }
    }

    private fun computeRequestStats(fromDate: LocalDate?, toDate: LocalDate?): Mono<RequestStats> {
        return requestRepository.findAll()
            .collectList()
            .map { requests ->
                val filtered = requests.filter { withinPeriod(it.createdAt.toLocalDate(), fromDate, toDate) }
                RequestStats(
                    total = filtered.size.toLong(),
                    open = filtered.count { it.state == "open" }.toLong(),
                    closed = filtered.count { it.state == "closed" }.toLong(),
                    cancelled = filtered.count { it.state == "cancelled" }.toLong(),
                    draft = filtered.count { it.state == "draft" }.toLong(),
                )
            }
    }

    private fun withinPeriod(value: LocalDate, fromDate: LocalDate?, toDate: LocalDate?): Boolean {
        val afterStart = fromDate == null || !value.isBefore(fromDate)
        val beforeEnd = toDate == null || !value.isAfter(toDate)
        return afterStart && beforeEnd
    }

    private fun ensureAdmin(principal: AuthenticatedUserPrincipal): Mono<Void> {
        return if (principal.role == UserRole.ADMIN) Mono.empty()
        else Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required"))
    }
}
