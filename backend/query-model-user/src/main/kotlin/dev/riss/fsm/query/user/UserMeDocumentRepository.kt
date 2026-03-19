package dev.riss.fsm.query.user

import org.springframework.data.mongodb.repository.ReactiveMongoRepository

interface UserMeDocumentRepository : ReactiveMongoRepository<UserMeDocument, String>
