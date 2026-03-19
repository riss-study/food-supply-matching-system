package dev.riss.fsm.command.request

import org.springframework.data.repository.reactive.ReactiveCrudRepository

interface RequestRepository : ReactiveCrudRepository<RequestEntity, String>
