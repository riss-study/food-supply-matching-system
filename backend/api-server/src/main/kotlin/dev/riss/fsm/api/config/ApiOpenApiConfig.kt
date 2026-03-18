package dev.riss.fsm.api.config

import io.swagger.v3.oas.annotations.enums.SecuritySchemeType
import io.swagger.v3.oas.annotations.security.SecurityScheme
import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.media.IntegerSchema
import io.swagger.v3.oas.models.media.ObjectSchema
import io.swagger.v3.oas.models.media.StringSchema
import io.swagger.v3.oas.models.security.SecurityRequirement
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
class ApiOpenApiConfig {

    @Bean
    fun apiOpenAPI(): OpenAPI {
        val successEnvelope = ObjectSchema()
            .addProperty("code", IntegerSchema().example(100))
            .addProperty("message", StringSchema().example("OK"))
            .addProperty("data", ObjectSchema())

        val errorEnvelope = ObjectSchema()
            .addProperty("code", IntegerSchema().example(4000))
            .addProperty("message", StringSchema().example("Validation failed"))
            .addProperty("traceId", StringSchema().example("trace-1234"))

        return OpenAPI()
            .info(
                Info()
                    .title("FSM API Server")
                    .version("0.1.0")
                    .description("Task 01 code-first Swagger/OpenAPI bootstrap for api-server")
            )
            .components(
                Components()
                    .addSchemas("ApiSuccessResponse", successEnvelope)
                    .addSchemas("ApiErrorResponse", errorEnvelope)
            )
            .addSecurityItem(SecurityRequirement().addList("bearerAuth"))
    }
}
