package dev.riss.fsm.query.admin.review

import org.springframework.data.mongodb.repository.ReactiveMongoRepository

interface AdminReviewQueueViewRepository : ReactiveMongoRepository<AdminReviewQueueItemDocument, String>

interface AdminReviewDetailViewRepository : ReactiveMongoRepository<AdminReviewDetailDocument, String>
