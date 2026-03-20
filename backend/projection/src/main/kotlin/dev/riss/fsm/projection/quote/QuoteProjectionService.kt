package dev.riss.fsm.projection.quote

import dev.riss.fsm.command.quote.QuoteEntity
import dev.riss.fsm.command.quote.QuoteRepository
import dev.riss.fsm.command.request.RequestRepository
import dev.riss.fsm.command.supplier.SupplierProfileRepository
import dev.riss.fsm.query.quote.QuoteComparisonDocument
import dev.riss.fsm.query.quote.QuoteComparisonRepository
import dev.riss.fsm.query.request.RequesterRequestSummaryRepository
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.ZoneOffset

@Service
class QuoteProjectionService(
    private val quoteComparisonRepository: QuoteComparisonRepository,
    private val requesterRequestSummaryRepository: RequesterRequestSummaryRepository,
    private val quoteRepository: QuoteRepository,
    private val requestRepository: RequestRepository,
    private val supplierProfileRepository: SupplierProfileRepository,
) {
    fun projectSubmitted(quote: QuoteEntity, threadId: String): Mono<QuoteEntity> {
        return buildDocument(quote, threadId)
            .flatMap { document -> quoteComparisonRepository.save(document) }
            .then(recalculateQuoteCount(quote.requestId))
            .thenReturn(quote)
    }

    fun projectUpdated(quote: QuoteEntity): Mono<QuoteEntity> {
        return quoteComparisonRepository.findById(quote.quoteId)
            .flatMap { existing ->
                quoteComparisonRepository.save(
                    existing.copy(
                        unitPriceEstimate = quote.unitPriceEstimate,
                        moq = quote.moq,
                        leadTime = quote.leadTime,
                        sampleCost = quote.sampleCost,
                        note = quote.note,
                        state = quote.state,
                        version = quote.version,
                        updatedAt = quote.updatedAt.toInstant(ZoneOffset.UTC),
                    )
                )
            }
            .thenReturn(quote)
    }

    fun projectStateChanged(quote: QuoteEntity): Mono<QuoteEntity> {
        return quoteComparisonRepository.findById(quote.quoteId)
            .flatMap { existing ->
                quoteComparisonRepository.save(
                    existing.copy(
                        state = quote.state,
                        version = quote.version,
                        updatedAt = quote.updatedAt.toInstant(ZoneOffset.UTC),
                    )
                )
            }
            .then(recalculateQuoteCount(quote.requestId))
            .thenReturn(quote)
    }

    fun syncRequestQuotes(requestId: String): Mono<Void> {
        return quoteRepository.findAllByRequestId(requestId)
            .flatMap { quote ->
                quoteComparisonRepository.findById(quote.quoteId)
                    .flatMap { existing ->
                        quoteComparisonRepository.save(
                            existing.copy(
                                state = quote.state,
                                version = quote.version,
                                updatedAt = quote.updatedAt.toInstant(ZoneOffset.UTC),
                            )
                        )
                    }
            }
            .then(recalculateQuoteCount(requestId))
    }

    private fun buildDocument(quote: QuoteEntity, threadId: String): Mono<QuoteComparisonDocument> {
        val requestMono = requestRepository.findById(quote.requestId)
        val supplierMono = supplierProfileRepository.findById(quote.supplierProfileId)

        return Mono.zip(requestMono, supplierMono)
            .map { tuple ->
                val request = tuple.t1
                val supplier = tuple.t2
                QuoteComparisonDocument(
                    quoteId = quote.quoteId,
                    requestId = quote.requestId,
                    supplierProfileId = quote.supplierProfileId,
                    companyName = supplier.companyName,
                    requestTitle = request.title,
                    requestCategory = request.category,
                    requestDesiredVolume = request.desiredVolume,
                    unitPriceEstimate = quote.unitPriceEstimate,
                    moq = quote.moq,
                    leadTime = quote.leadTime,
                    sampleCost = quote.sampleCost,
                    note = quote.note,
                    state = quote.state,
                    version = quote.version,
                    threadId = threadId,
                    submittedAt = quote.createdAt.toInstant(ZoneOffset.UTC),
                    updatedAt = quote.updatedAt.toInstant(ZoneOffset.UTC),
                )
            }
    }

    private fun recalculateQuoteCount(requestId: String): Mono<Void> {
        val countMono = quoteComparisonRepository.findAllByRequestId(requestId)
            .filter { document -> document.state != "withdrawn" }
            .count()

        return Mono.zip(requesterRequestSummaryRepository.findById(requestId), countMono)
            .flatMap { tuple ->
                val summary = tuple.t1
                val count = tuple.t2.toInt()
                requesterRequestSummaryRepository.save(summary.copy(quoteCount = count))
            }
            .then()
    }
}
