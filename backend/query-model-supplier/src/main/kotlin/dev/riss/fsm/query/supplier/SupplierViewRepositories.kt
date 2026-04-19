package dev.riss.fsm.query.supplier

import org.springframework.data.mongodb.repository.Aggregation
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux

interface SupplierSearchViewRepository : ReactiveMongoRepository<SupplierSearchViewDocument, String> {

    @Aggregation(
        pipeline = [
            "{ \$unwind: '\$categories' }",
            "{ \$group: { _id: '\$categories', supplierCount: { \$sum: 1 } } }",
            "{ \$project: { _id: 0, category: '\$_id', supplierCount: 1 } }",
            "{ \$sort: { category: 1 } }",
        ],
    )
    fun aggregateCategoryCounts(): Flux<SupplierCategoryCountProjection>

    @Aggregation(
        pipeline = [
            "{ \$group: { _id: '\$region', supplierCount: { \$sum: 1 } } }",
            "{ \$project: { _id: 0, region: '\$_id', supplierCount: 1 } }",
            "{ \$sort: { region: 1 } }",
        ],
    )
    fun aggregateRegionCounts(): Flux<SupplierRegionCountProjection>
}

interface SupplierDetailViewRepository : ReactiveMongoRepository<SupplierDetailViewDocument, String>

data class SupplierCategoryCountProjection(
    val category: String,
    val supplierCount: Int,
)

data class SupplierRegionCountProjection(
    val region: String,
    val supplierCount: Int,
)
