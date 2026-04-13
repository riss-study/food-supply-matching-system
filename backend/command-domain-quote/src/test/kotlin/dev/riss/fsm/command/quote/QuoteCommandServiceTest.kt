package dev.riss.fsm.command.quote

import dev.riss.fsm.command.request.RequestEntity
import dev.riss.fsm.command.request.RequestRepository
import dev.riss.fsm.command.thread.MessageRepository
import dev.riss.fsm.command.thread.MessageThreadRepository
import dev.riss.fsm.command.thread.MessageThreadEntity
import dev.riss.fsm.command.thread.ThreadParticipantReadStateRepository
import dev.riss.fsm.command.thread.ThreadCommandService
import dev.riss.fsm.shared.error.DuplicateActiveQuoteException
import dev.riss.fsm.shared.error.QuoteSubmissionForbiddenException
import dev.riss.fsm.shared.error.QuoteUpdateForbiddenException
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.Mockito.`when`
import org.mockito.Mockito.any
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.test.StepVerifier
import java.time.LocalDateTime

@ExtendWith(MockitoExtension::class)
class QuoteCommandServiceTest {
    @Mock private lateinit var quoteRepository: QuoteRepository
    @Mock private lateinit var requestRepository: RequestRepository
    @Mock private lateinit var messageThreadRepository: MessageThreadRepository
    @Mock private lateinit var messageRepository: MessageRepository
    @Mock private lateinit var readStateRepository: ThreadParticipantReadStateRepository

    private lateinit var quoteCommandService: QuoteCommandService

    @BeforeEach
    fun setUp() {
        val threadCommandService = ThreadCommandService(messageThreadRepository, messageRepository, readStateRepository)
        quoteCommandService = QuoteCommandService(quoteRepository, requestRepository, threadCommandService)
    }

    @Test
    fun `submit creates quote and thread for open request`() {
        val request = openRequest()
        `when`(requestRepository.findById(request.requestId)).thenReturn(Mono.just(request))
        `when`(quoteRepository.existsByRequestIdAndSupplierProfileIdAndStateIn(request.requestId, "sprof_1", listOf("submitted", "selected"))).thenReturn(Mono.just(false))
        `when`(quoteRepository.save(any())).thenAnswer { invocation -> Mono.just(invocation.getArgument<QuoteEntity>(0)) }
        `when`(
            messageThreadRepository.findByRequestIdAndRequesterUserIdAndSupplierProfileId(
                request.requestId,
                request.requesterUserId,
                "sprof_1",
            )
        ).thenReturn(Mono.empty())
        `when`(messageThreadRepository.save(any())).thenReturn(
            Mono.just(
                MessageThreadEntity(
                    threadId = "thd_1",
                    requestId = request.requestId,
                    requesterUserId = request.requesterUserId,
                    supplierProfileId = "sprof_1",
                    quoteId = "quo_x",
                    contactShareState = "not_requested",
                    createdAt = LocalDateTime.now(),
                )
            )
        )

        StepVerifier.create(
            quoteCommandService.submit(
                SubmitQuoteCommand(
                    requestId = request.requestId,
                    supplierProfileId = "sprof_1",
                    unitPriceEstimate = 800,
                    moq = 2000,
                    leadTime = 30,
                    sampleCost = 50000,
                    note = "테스트 견적",
                )
            )
        )
            .assertNext { result ->
                assertEquals("submitted", result.quote.state)
                assertEquals("thd_1", result.threadId)
            }
            .verifyComplete()
    }

    @Test
    fun `submit rejects duplicate active quote`() {
        val request = openRequest()
        `when`(requestRepository.findById(request.requestId)).thenReturn(Mono.just(request))
        `when`(quoteRepository.existsByRequestIdAndSupplierProfileIdAndStateIn(request.requestId, "sprof_1", listOf("submitted", "selected"))).thenReturn(Mono.just(true))

        StepVerifier.create(
            quoteCommandService.submit(
                SubmitQuoteCommand(request.requestId, "sprof_1", 800, 2000, 30, null, null)
            )
        )
            .expectErrorSatisfies { error -> assertTrue(error is DuplicateActiveQuoteException) }
            .verify()
    }

    @Test
    fun `submit rejects closed request`() {
        `when`(requestRepository.findById("req_1")).thenReturn(Mono.just(openRequest().copy(state = "closed")))

        StepVerifier.create(
            quoteCommandService.submit(
                SubmitQuoteCommand("req_1", "sprof_1", 800, 2000, 30, null, null)
            )
        )
            .expectErrorSatisfies { error -> assertTrue(error is QuoteSubmissionForbiddenException) }
            .verify()
    }

    @Test
    fun `update increments version for submitted quote`() {
        val quote = submittedQuote()
        `when`(quoteRepository.findById(quote.quoteId)).thenReturn(Mono.just(quote))
        `when`(quoteRepository.save(any())).thenAnswer { invocation -> Mono.just(invocation.getArgument<QuoteEntity>(0)) }

        StepVerifier.create(
            quoteCommandService.update(
                quote.quoteId,
                quote.supplierProfileId,
                UpdateQuoteCommand(unitPriceEstimate = 750)
            )
        )
            .assertNext { updated ->
                assertEquals(750, updated.unitPriceEstimate)
                assertEquals(2, updated.version)
            }
            .verifyComplete()
    }

    @Test
    fun `withdraw changes submitted quote to withdrawn`() {
        val quote = submittedQuote()
        `when`(quoteRepository.findById(quote.quoteId)).thenReturn(Mono.just(quote))
        `when`(quoteRepository.save(any())).thenAnswer { invocation -> Mono.just(invocation.getArgument<QuoteEntity>(0)) }

        StepVerifier.create(quoteCommandService.withdraw(quote.quoteId, quote.supplierProfileId))
            .assertNext { updated -> assertEquals("withdrawn", updated.state) }
            .verifyComplete()
    }

    @Test
    fun `update rejects non owner supplier`() {
        val quote = submittedQuote()
        `when`(quoteRepository.findById(quote.quoteId)).thenReturn(Mono.just(quote))

        StepVerifier.create(
            quoteCommandService.update(
                quote.quoteId,
                "sprof_other",
                UpdateQuoteCommand(unitPriceEstimate = 750)
            )
        )
            .expectErrorSatisfies { error ->
                assertTrue(error is ResponseStatusException)
                assertEquals(HttpStatus.FORBIDDEN, (error as ResponseStatusException).statusCode)
            }
            .verify()
    }

    @Test
    fun `select closes request and marks others declined`() {
        val quote = submittedQuote()
        val other = submittedQuote().copy(quoteId = "quo_2", supplierProfileId = "sprof_2")
        val request = openRequest()
        `when`(quoteRepository.findById(quote.quoteId)).thenReturn(Mono.just(quote))
        `when`(requestRepository.findById(request.requestId)).thenReturn(Mono.just(request))
        `when`(quoteRepository.save(any())).thenAnswer { invocation -> Mono.just(invocation.getArgument<QuoteEntity>(0)) }
        `when`(quoteRepository.findAllByRequestIdAndState(request.requestId, "submitted")).thenReturn(Flux.just(quote, other))
        `when`(requestRepository.save(any())).thenAnswer { invocation -> Mono.just(invocation.getArgument<RequestEntity>(0)) }

        StepVerifier.create(quoteCommandService.select(quote.quoteId, request.requesterUserId))
            .assertNext { result ->
                assertEquals("selected", result.quote.state)
                assertEquals("closed", result.request.state)
            }
            .verifyComplete()
    }

    @Test
    fun `select rejects non owner requester`() {
        val quote = submittedQuote()
        val request = openRequest()
        `when`(quoteRepository.findById(quote.quoteId)).thenReturn(Mono.just(quote))
        `when`(requestRepository.findById(request.requestId)).thenReturn(Mono.just(request))

        StepVerifier.create(quoteCommandService.select(quote.quoteId, "usr_other"))
            .expectErrorSatisfies { error ->
                assertTrue(error is ResponseStatusException)
                assertEquals(HttpStatus.FORBIDDEN, (error as ResponseStatusException).statusCode)
            }
            .verify()
    }

    @Test
    fun `decline rejects non-submitted quote`() {
        val quote = submittedQuote().copy(state = "selected")
        val request = openRequest()
        `when`(quoteRepository.findById(quote.quoteId)).thenReturn(Mono.just(quote))
        `when`(requestRepository.findById(request.requestId)).thenReturn(Mono.just(request))

        StepVerifier.create(quoteCommandService.decline(quote.quoteId, request.requesterUserId))
            .expectErrorSatisfies { error -> assertTrue(error is QuoteUpdateForbiddenException) }
            .verify()
    }

    private fun openRequest() = RequestEntity(
        requestId = "req_1",
        requesterUserId = "usr_req",
        mode = "public",
        title = "견적 테스트 의뢰",
        category = "snack",
        desiredVolume = "1000",
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

    private fun submittedQuote() = QuoteEntity(
        quoteId = "quo_1",
        requestId = "req_1",
        supplierProfileId = "sprof_1",
        unitPriceEstimate = 800,
        moq = 2000,
        leadTime = 30,
        sampleCost = 50000,
        note = "기본 견적",
        state = "submitted",
        version = 1,
        createdAt = LocalDateTime.now(),
        updatedAt = LocalDateTime.now(),
    )
}
