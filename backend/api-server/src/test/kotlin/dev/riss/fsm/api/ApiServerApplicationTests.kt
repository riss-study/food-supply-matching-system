package dev.riss.fsm.api

import dev.riss.fsm.api.bootstrap.ApiBootstrapController
import dev.riss.fsm.api.config.ApiOpenApiConfig
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class ApiServerApplicationTests {

    @Test
    fun bootstrapHealthReturnsSuccessEnvelope() {
        val response = ApiBootstrapController().health()

        assertEquals(100, response.code)
        assertEquals("api-server", response.data["service"])
    }

    @Test
    fun openApiConfigCreatesExpectedDocumentMetadata() {
        val openAPI = ApiOpenApiConfig().apiOpenAPI()

        assertEquals("FSM API Server", openAPI.info.title)
        assertTrue(openAPI.components.schemas.containsKey("ApiSuccessResponse"))
    }
}
