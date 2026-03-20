package dev.riss.fsm.api.quote

import dev.riss.fsm.api.request.RequestAccessGuard
import dev.riss.fsm.projection.request.RequestProjectionService
import dev.riss.fsm.command.quote.QuoteCommandService
import dev.riss.fsm.command.quote.SubmitQuoteCommand
import dev.riss.fsm.command.quote.UpdateQuoteCommand
import dev.riss.fsm.projection.quote.QuoteProjectionService
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.ZoneOffset

@Service
class QuoteApplicationService(
    private val requestAccessGuard: RequestAccessGuard,
    private val quoteCommandService: QuoteCommandService,
    private val quoteProjectionService: QuoteProjectionService,
    private val requestProjectionService: RequestProjectionService,
) {
    fun submit(principal: AuthenticatedUserPrincipal, requestId: String, request: SubmitQuoteRequest): Mono<SubmitQuoteResponse> {
        return requestAccessGuard.checkCanSubmitQuote(principal, requestId)
            .then(requestAccessGuard.getSupplierProfileId(principal.userId))
            .flatMap { supplierProfileId ->
                quoteCommandService.submit(
                    SubmitQuoteCommand(
                        requestId = requestId,
                        supplierProfileId = supplierProfileId,
                        unitPriceEstimate = request.unitPriceEstimate,
                        moq = request.moq,
                        leadTime = request.leadTime,
                        sampleCost = request.sampleCost,
                        note = request.note,
                    )
                )
            }
            .flatMap { result ->
                quoteProjectionService.projectSubmitted(result.quote, result.threadId)
                    .thenReturn(result)
            }
            .map { result ->
                SubmitQuoteResponse(
                    quoteId = result.quote.quoteId,
                    state = result.quote.state,
                    threadId = result.threadId,
                    createdAt = result.quote.createdAt.toInstant(ZoneOffset.UTC),
                )
            }
    }

    fun update(principal: AuthenticatedUserPrincipal, quoteId: String, request: UpdateQuoteRequest): Mono<UpdateQuoteResponse> {
        return requestAccessGuard.getSupplierProfileId(principal.userId)
            .flatMap { supplierProfileId ->
                quoteCommandService.update(
                    quoteId = quoteId,
                    supplierProfileId = supplierProfileId,
                    command = UpdateQuoteCommand(
                        unitPriceEstimate = request.unitPriceEstimate,
                        moq = request.moq,
                        leadTime = request.leadTime,
                        sampleCost = request.sampleCost,
                        note = request.note,
                    )
                )
            }
            .flatMap { quote -> quoteProjectionService.projectUpdated(quote) }
            .map { quote ->
                UpdateQuoteResponse(
                    quoteId = quote.quoteId,
                    state = quote.state,
                    version = quote.version,
                    updatedAt = quote.updatedAt.toInstant(ZoneOffset.UTC),
                )
            }
    }

    fun withdraw(principal: AuthenticatedUserPrincipal, quoteId: String): Mono<WithdrawQuoteResponse> {
        return requestAccessGuard.getSupplierProfileId(principal.userId)
            .flatMap { supplierProfileId -> quoteCommandService.withdraw(quoteId, supplierProfileId) }
            .flatMap { quote -> quoteProjectionService.projectStateChanged(quote) }
            .map { quote ->
                WithdrawQuoteResponse(
                    quoteId = quote.quoteId,
                    state = quote.state,
                    withdrawnAt = quote.updatedAt.toInstant(ZoneOffset.UTC),
                )
            }
    }

    fun select(principal: AuthenticatedUserPrincipal, quoteId: String): Mono<SelectQuoteResponse> {
        return quoteCommandService.select(quoteId, principal.userId)
            .flatMap { result ->
                quoteProjectionService.projectStateChanged(result.quote)
                    .then(quoteProjectionService.syncRequestQuotes(result.request.requestId))
                    .then(requestProjectionService.projectRequestClosed(result.request))
                    .thenReturn(result)
            }
            .map { result ->
                SelectQuoteResponse(
                    quoteId = result.quote.quoteId,
                    state = result.quote.state,
                    requestState = result.request.state,
                    selectedAt = result.quote.updatedAt.toInstant(ZoneOffset.UTC),
                )
            }
    }

    fun decline(principal: AuthenticatedUserPrincipal, quoteId: String, request: DeclineQuoteRequest?): Mono<DeclineQuoteResponse> {
        return quoteCommandService.decline(quoteId, principal.userId)
            .flatMap { quote -> quoteProjectionService.projectStateChanged(quote) }
            .map { quote ->
                DeclineQuoteResponse(
                    quoteId = quote.quoteId,
                    state = quote.state,
                    declinedAt = quote.updatedAt.toInstant(ZoneOffset.UTC),
                )
            }
    }
}
