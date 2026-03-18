package dev.riss.fsm.admin

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.ApplicationContext
import org.springframework.test.web.reactive.server.WebTestClient

@SpringBootTest
class AdminServerApplicationTests {

    @Autowired
    private lateinit var applicationContext: ApplicationContext

    private lateinit var webTestClient: WebTestClient

    @BeforeEach
    fun setUp() {
        webTestClient = WebTestClient.bindToApplicationContext(applicationContext).build()
    }

    @Test
    fun contextLoads() {
    }

    @Test
    fun bootstrapHealthReturnsSuccessEnvelope() {
        webTestClient.get()
            .uri("/api/admin/bootstrap/health")
            .exchange()
            .expectStatus().isOk
            .expectBody()
            .jsonPath("$.code").isEqualTo(100)
            .jsonPath("$.data.service").isEqualTo("admin-server")
    }
}
