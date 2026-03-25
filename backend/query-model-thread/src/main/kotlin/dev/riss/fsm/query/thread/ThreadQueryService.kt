package dev.riss.fsm.query.thread

import dev.riss.fsm.shared.error.ThreadNotFoundException
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Service
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
