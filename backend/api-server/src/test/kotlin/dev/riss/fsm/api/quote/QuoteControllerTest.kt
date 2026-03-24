package dev.riss.fsm.api.quote

import jakarta.validation.Valid
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class QuoteControllerTest {

    @Test
    fun `decline endpoint validates request body`() {
        val method = QuoteController::class.java.declaredMethods.first {
            it.name == "decline" && it.parameterCount == 3
        }

        assertTrue(
            method.parameters[2].annotations.any { annotation -> annotation.annotationClass == Valid::class }
        )
    }
}
