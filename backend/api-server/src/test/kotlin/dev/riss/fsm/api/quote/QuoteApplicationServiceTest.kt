package dev.riss.fsm.api.quote

import dev.riss.fsm.api.request.RequestAccessGuard
import dev.riss.fsm.command.quote.QuoteEntity
import dev.riss.fsm.command.quote.QuoteCommandService
import dev.riss.fsm.command.quote.SubmitQuoteCommand
import dev.riss.fsm.command.quote.SubmittedQuoteResult
import dev.riss.fsm.command.request.RequestEntity
import dev.riss.fsm.command.thread.MessageThreadEntity
import dev.riss.fsm.shared.auth.UserRole
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import reactor.core.publisher.Mono
import reactor.test.StepVerifier
import java.time.LocalDateTime

class QuoteApplicationServiceTest {

    private val requestAccessGuard = mock(RequestAccessGuard::class.java)
    private val quoteCommandService = mock(QuoteCommandService::class.java)
    private val service = QuoteApplicationService(requestAccessGuard, quoteCommandService)

    @Test
    fun `submit returns response from command result`() {
        val principal = AuthenticatedUserPrincipal("usr_sup", "sup@example.com", UserRole.SUPPLIER)
        val requestId = "req_1"
        val submitRequest = SubmitQuoteRequest(
            unitPriceEstimate = "1000",
            moq = "100",
            leadTime = "7",
            sampleCost = "10000",
            note = "note",
        )
        val quote = QuoteEntity(
            quoteId = "quo_1",
            requestId = requestId,
            supplierProfileId = "sprof_1",
            unitPriceEstimate = "1000",
            moq = "100",
            leadTime = "7",
            sampleCost = "10000",
            note = "note",
            state = "submitted",
            version = 1,
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now(),
        )
        val thread = MessageThreadEntity(
            threadId = "thd_1",
            requestId = requestId,
            requesterUserId = "usr_req",
            supplierProfileId = "sprof_1",
            quoteId = quote.quoteId,
            contactShareState = "not_requested",
            createdAt = LocalDateTime.now(),
        )
        val request = RequestEntity(
            requestId = requestId,
            requesterUserId = "usr_req",
            mode = "public",
            title = "Test request",
            category = "snack",
            desiredVolume = "100",
            targetPriceMin = null,
            targetPriceMax = null,
            certificationRequirement = null,
            rawMaterialRule = null,
            packagingRequirement = null,
            deliveryRequirement = null,
            notes = null,
            state = "open",
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now(),
        )

        `when`(requestAccessGuard.checkCanSubmitQuote(principal, requestId)).thenReturn(Mono.empty())
        `when`(requestAccessGuard.getSupplierProfileId(principal.userId)).thenReturn(Mono.just("sprof_1"))
        `when`(quoteCommandService.submit(SubmitQuoteCommand(requestId, "sprof_1", "1000", "100", "7", "10000", "note")))
            .thenReturn(Mono.just(SubmittedQuoteResult(quote, thread.threadId, thread, request)))

        StepVerifier.create(service.submit(principal, requestId, submitRequest))
            .expectNextMatches { response -> response.threadId == thread.threadId && response.quoteId == quote.quoteId }
            .verifyComplete()
    }
}
