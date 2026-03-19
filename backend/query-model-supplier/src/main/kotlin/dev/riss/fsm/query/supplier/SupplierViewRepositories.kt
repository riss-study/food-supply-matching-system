package dev.riss.fsm.query.supplier

import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux

interface SupplierSearchViewRepository : ReactiveMongoRepository<SupplierSearchViewDocument, String>

interface SupplierDetailViewRepository : ReactiveMongoRepository<SupplierDetailViewDocument, String>
