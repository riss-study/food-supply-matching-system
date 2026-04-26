package dev.riss.fsm.command.request

import org.springframework.data.r2dbc.repository.Modifying
import org.springframework.data.r2dbc.repository.Query
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.LocalDateTime

interface RequestRepository : ReactiveCrudRepository<RequestEntity, String> {
    fun findAllByRequesterUserId(requesterUserId: String): Flux<RequestEntity>

    /**
     * 동시 select() race 방지: state="open" 일 때만 closed 로 전환.
     * 두 transaction 이 동시에 select() 진입 시 한쪽만 row 영향 → 다른쪽 0 row → race detected.
     * @return 영향받은 row 수 (0=race lost, 1=success)
     */
    @Modifying
    @Query("UPDATE request_record SET state = 'closed', updated_at = :now WHERE id = :id AND state = 'open'")
    fun closeIfOpen(id: String, now: LocalDateTime): Mono<Long>
}
