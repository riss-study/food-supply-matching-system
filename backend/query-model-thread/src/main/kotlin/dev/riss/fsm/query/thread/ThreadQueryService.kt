package dev.riss.fsm.query.thread

import dev.riss.fsm.shared.error.ThreadNotFoundException
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

// Dormant Mongo-backed query service. Superseded by api-server direct R2DBC read path
// (Phase 3 Task A, Stage 4). Class retained until Stage 8 removes the query-model-thread module.
class ThreadQueryService(
    private val threadSummaryRepository: ThreadSummaryRepository,
    private val threadDetailRepository: ThreadDetailRepository,
) {
    fun getThreadSummariesForRequester(
        requesterUserId: String,
        unreadOnly: Boolean = false,
    ): Flux<ThreadSummaryDocument> {
        return threadSummaryRepository.findAllByRequesterUserIdOrderByUpdatedAtDesc(requesterUserId)
            .filter { document -> !unreadOnly || document.requesterUnreadCount > 0 }
    }

    fun getThreadSummariesForSupplier(
        supplierProfileId: String,
        unreadOnly: Boolean = false,
    ): Flux<ThreadSummaryDocument> {
        return threadSummaryRepository.findAllBySupplierProfileIdOrderByUpdatedAtDesc(supplierProfileId)
            .filter { document -> !unreadOnly || document.supplierUnreadCount > 0 }
    }

    fun getThreadDetail(threadId: String): Mono<ThreadDetailDocument> {
        return threadDetailRepository.findById(threadId)
            .switchIfEmpty(Mono.error(ThreadNotFoundException()))
    }
}
