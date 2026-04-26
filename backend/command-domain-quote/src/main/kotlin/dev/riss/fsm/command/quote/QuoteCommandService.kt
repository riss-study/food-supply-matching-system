package dev.riss.fsm.command.quote

import dev.riss.fsm.command.request.RequestEntity
import dev.riss.fsm.command.request.RequestRepository
import dev.riss.fsm.command.thread.CreateThreadCommand
import dev.riss.fsm.command.thread.MessageThreadEntity
import dev.riss.fsm.command.thread.ThreadCommandService
import dev.riss.fsm.shared.error.DuplicateActiveQuoteException
import dev.riss.fsm.shared.error.QuoteNotFoundException
import dev.riss.fsm.shared.error.QuoteOwnerMismatchException
import dev.riss.fsm.shared.error.QuoteSubmissionForbiddenException
import dev.riss.fsm.shared.error.QuoteUpdateForbiddenException
import dev.riss.fsm.shared.error.RequestAccessForbiddenException
import dev.riss.fsm.shared.error.RequestNotFoundException
import dev.riss.fsm.shared.error.RequestStateTransitionException
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.dao.TransientDataAccessException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
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
            .switchIfEmpty(Mono.error(RequestNotFoundException()))
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
                        // TOCTOU race: existsBy* 와 save 사이에 다른 동시 submit 이 들어와
                        // uk_active_quote (request_id, supplier_profile_id, state) UNIQUE 위반 →
                        // 도메인 예외로 변환 (5000 SQL leak 방지).
                        .onErrorMap(DataIntegrityViolationException::class.java) { DuplicateActiveQuoteException() }
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
            .switchIfEmpty(Mono.error(QuoteNotFoundException()))
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
            .switchIfEmpty(Mono.error(QuoteNotFoundException()))
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

    /**
     * Quote select 는 다음 3가지가 한 transaction 으로 실행되어야 함:
     *  - 선택된 quote.state = "selected"
     *  - request.state = "closed"
     *  - 나머지 submitted quote 들 = "declined"
     * 부분 실패 시 일관성 깨지지 않도록 Spring `@Transactional` (reactive R2dbcTransactionManager).
     * Mono.zip 병렬 대신 sequential chain 으로 ordering 도 보장.
     *
     * 동시 select race 보호: requestRepository.save(state="closed") 는 PK 기반 unconditional UPDATE 라
     * 두 transaction 모두 1 row affected → 둘 다 selected 가능. 이를 막기 위해 closeIfOpen(state='open' 조건부)
     * 으로 변경 — 1번째 tx 만 1 row, 2번째 tx 는 0 row → RequestStateTransitionException 으로 변환.
     */
    @Transactional
    fun select(quoteId: String, requestOwnerId: String): Mono<SelectedQuoteResult> {
        return loadQuoteWithRequest(quoteId)
            .flatMap { pair ->
                val quote = pair.quote
                val request = pair.request
                ensureRequestOwnership(request, requestOwnerId)
                ensureSubmittedState(quote)
                val now = LocalDateTime.now()

                quoteRepository.save(
                    quote.copy(
                        state = "selected",
                        version = quote.version + 1,
                        updatedAt = now,
                    )
                ).flatMap { savedQuote ->
                    requestRepository.closeIfOpen(request.requestId, now)
                        .flatMap { affected ->
                            if (affected == 0L) {
                                Mono.error(RequestStateTransitionException("Request is no longer open (concurrent select or already closed)"))
                            } else {
                                val savedRequest = request.copy(state = "closed", updatedAt = now)
                                quoteRepository.findAllByRequestIdAndState(request.requestId, "submitted")
                                    .filter { candidate -> candidate.quoteId != quote.quoteId }
                                    .flatMap { candidate ->
                                        quoteRepository.save(
                                            candidate.copy(
                                                state = "declined",
                                                version = candidate.version + 1,
                                                updatedAt = now,
                                            )
                                        )
                                    }
                                    .then(Mono.just(SelectedQuoteResult(savedQuote, savedRequest)))
                            }
                        }
                }
                    // 동시 select 시 두 transaction 의 request row lock 경합으로 deadlock 발생 가능.
                    // 또는 unique 제약 충돌. 5000 SQL leak 막기 위해 도메인 예외로 변환.
                    .onErrorMap(TransientDataAccessException::class.java) {
                        RequestStateTransitionException("Request was concurrently updated; please retry")
                    }
                    .onErrorMap(DataIntegrityViolationException::class.java) {
                        RequestStateTransitionException("Quote selection conflict; please retry")
                    }
            }
    }

    fun getByRequest(requestId: String): Flux<QuoteEntity> = quoteRepository.findAllByRequestId(requestId)

    fun getBySupplierProfile(supplierProfileId: String): Flux<QuoteEntity> = quoteRepository.findAllBySupplierProfileId(supplierProfileId)

    private fun loadQuoteWithRequest(quoteId: String): Mono<QuoteWithRequest> {
        return quoteRepository.findById(quoteId)
            .switchIfEmpty(Mono.error(QuoteNotFoundException()))
            .flatMap { quote ->
                requestRepository.findById(quote.requestId)
                    .switchIfEmpty(Mono.error(RequestNotFoundException()))
                    .map { request -> QuoteWithRequest(quote, request) }
            }
    }

    private fun ensureQuoteOwnership(quote: QuoteEntity, supplierProfileId: String) {
        if (quote.supplierProfileId != supplierProfileId) {
            throw QuoteOwnerMismatchException()
        }
    }

    private fun ensureRequestOwnership(request: RequestEntity, requesterUserId: String) {
        if (request.requesterUserId != requesterUserId) {
            throw RequestAccessForbiddenException()
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
    val unitPriceEstimate: String,
    val moq: String,
    val leadTime: String,
    val sampleCost: String?,
    val note: String?,
)

data class UpdateQuoteCommand(
    val unitPriceEstimate: String? = null,
    val moq: String? = null,
    val leadTime: String? = null,
    val sampleCost: String? = null,
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
