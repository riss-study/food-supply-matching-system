package dev.riss.fsm.command.quote

import dev.riss.fsm.command.request.RequestEntity
import dev.riss.fsm.command.request.RequestRepository
import dev.riss.fsm.command.thread.CreateThreadCommand
import dev.riss.fsm.command.thread.MessageThreadEntity
import dev.riss.fsm.command.thread.ThreadCommandService
import dev.riss.fsm.shared.error.DuplicateActiveQuoteException
import dev.riss.fsm.shared.error.QuoteSubmissionForbiddenException
import dev.riss.fsm.shared.error.QuoteUpdateForbiddenException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.LocalDateTime
import java.util.UUID

@Service
class QuoteCommandService(
    private val quoteRepository: QuoteRepository,
    private val requestRepository: RequestRepository,
    private val threadCommandService: ThreadCommandService,
) {
    fun submit(command: SubmitQuoteCommand): Mono<SubmittedQuoteResult> {
        return requestRepository.findById(command.requestId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found")))
            .flatMap { request ->
                if (request.state != "open") {
                    return@flatMap Mono.error(QuoteSubmissionForbiddenException("Closed or cancelled requests cannot accept quotes"))
                }

                quoteRepository.existsByRequestIdAndSupplierProfileIdAndStateIn(
                    command.requestId,
                    command.supplierProfileId,
                    listOf("submitted", "selected")
                ).flatMap { exists ->
                    if (exists) {
                        return@flatMap Mono.error(DuplicateActiveQuoteException())
                    }

                    val quote = QuoteEntity(
                        quoteId = "quo_${UUID.randomUUID()}",
                        requestId = command.requestId,
                        supplierProfileId = command.supplierProfileId,
                        unitPriceEstimate = command.unitPriceEstimate,
                        moq = command.moq,
                        leadTime = command.leadTime,
                        sampleCost = command.sampleCost,
                        note = command.note,
                        state = "submitted",
                        version = 1,
                        createdAt = LocalDateTime.now(),
                        updatedAt = LocalDateTime.now(),
                    ).apply { newEntity = true }

                    quoteRepository.save(quote)
                        .flatMap { savedQuote ->
                            threadCommandService.createThread(
                                CreateThreadCommand(
                                    requestId = request.requestId,
                                    requesterUserId = request.requesterUserId,
                                    supplierProfileId = savedQuote.supplierProfileId,
                                    quoteId = savedQuote.quoteId,
                                )
                            ).map { result -> SubmittedQuoteResult(savedQuote, result.thread.threadId, result.thread, request) }
                        }
                }
            }
    }

    fun update(quoteId: String, supplierProfileId: String, command: UpdateQuoteCommand): Mono<QuoteEntity> {
        if (command.changedImmutableFields) {
            return Mono.error(QuoteUpdateForbiddenException("Immutable fields are not allowed in this patch"))
        }

        return quoteRepository.findById(quoteId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Quote not found")))
            .flatMap { quote ->
                ensureQuoteOwnership(quote, supplierProfileId)
                ensureSubmittedState(quote)

                quoteRepository.save(
                    quote.copy(
                        unitPriceEstimate = command.unitPriceEstimate ?: quote.unitPriceEstimate,
                        moq = command.moq ?: quote.moq,
                        leadTime = command.leadTime ?: quote.leadTime,
                        sampleCost = command.sampleCost ?: quote.sampleCost,
                        note = command.note ?: quote.note,
                        version = quote.version + 1,
                        updatedAt = LocalDateTime.now(),
                    )
                )
            }
    }

    fun withdraw(quoteId: String, supplierProfileId: String): Mono<QuoteEntity> {
        return quoteRepository.findById(quoteId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Quote not found")))
            .flatMap { quote ->
                ensureQuoteOwnership(quote, supplierProfileId)
                ensureSubmittedState(quote)
                quoteRepository.save(quote.copy(state = "withdrawn", updatedAt = LocalDateTime.now()))
            }
    }

    fun decline(quoteId: String, requestOwnerId: String): Mono<QuoteEntity> {
        return loadQuoteWithRequest(quoteId)
            .flatMap { pair ->
                val quote = pair.quote
                val request = pair.request
                ensureRequestOwnership(request, requestOwnerId)
                ensureSubmittedState(quote)
                quoteRepository.save(quote.copy(state = "declined", updatedAt = LocalDateTime.now()))
            }
    }

    fun select(quoteId: String, requestOwnerId: String): Mono<SelectedQuoteResult> {
        return loadQuoteWithRequest(quoteId)
            .flatMap { pair ->
                val quote = pair.quote
                val request = pair.request
                ensureRequestOwnership(request, requestOwnerId)
                ensureSubmittedState(quote)

                val selectedQuoteMono = quoteRepository.save(
                    quote.copy(
                        state = "selected",
                        updatedAt = LocalDateTime.now(),
                    )
                )

                val closeRequestMono = requestRepository.save(
                    request.copy(
                        state = "closed",
                        updatedAt = LocalDateTime.now(),
                    )
                )

                val declineOthersMono = quoteRepository.findAllByRequestIdAndState(request.requestId, "submitted")
                    .filter { candidate -> candidate.quoteId != quote.quoteId }
                    .flatMap { candidate ->
                        quoteRepository.save(candidate.copy(state = "declined", updatedAt = LocalDateTime.now()))
                    }
                    .collectList()

                Mono.zip(selectedQuoteMono, closeRequestMono, declineOthersMono)
                    .map { tuple -> SelectedQuoteResult(tuple.t1, tuple.t2) }
            }
    }

    fun getByRequest(requestId: String): Flux<QuoteEntity> = quoteRepository.findAllByRequestId(requestId)

    fun getBySupplierProfile(supplierProfileId: String): Flux<QuoteEntity> = quoteRepository.findAllBySupplierProfileId(supplierProfileId)

    private fun loadQuoteWithRequest(quoteId: String): Mono<QuoteWithRequest> {
        return quoteRepository.findById(quoteId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Quote not found")))
            .flatMap { quote ->
                requestRepository.findById(quote.requestId)
                    .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found")))
                    .map { request -> QuoteWithRequest(quote, request) }
            }
    }

    private fun ensureQuoteOwnership(quote: QuoteEntity, supplierProfileId: String) {
        if (quote.supplierProfileId != supplierProfileId) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Not the quote owner")
        }
    }

    private fun ensureRequestOwnership(request: RequestEntity, requesterUserId: String) {
        if (request.requesterUserId != requesterUserId) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Not the request owner")
        }
    }

    private fun ensureSubmittedState(quote: QuoteEntity) {
        if (quote.state != "submitted") {
            throw QuoteUpdateForbiddenException("Only submitted quotes can change state")
        }
    }
}

data class SubmitQuoteCommand(
    val requestId: String,
    val supplierProfileId: String,
    val unitPriceEstimate: Int,
    val moq: Int,
    val leadTime: Int,
    val sampleCost: Int?,
    val note: String?,
)

data class UpdateQuoteCommand(
    val unitPriceEstimate: Int? = null,
    val moq: Int? = null,
    val leadTime: Int? = null,
    val sampleCost: Int? = null,
    val note: String? = null,
    val changedImmutableFields: Boolean = false,
)

data class SubmittedQuoteResult(
    val quote: QuoteEntity,
    val threadId: String,
    val thread: MessageThreadEntity,
    val request: RequestEntity,
)

data class SelectedQuoteResult(
    val quote: QuoteEntity,
    val request: RequestEntity,
)

private data class QuoteWithRequest(
    val quote: QuoteEntity,
    val request: RequestEntity,
)
