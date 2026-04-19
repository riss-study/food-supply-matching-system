package dev.riss.fsm.api.config

import io.swagger.v3.oas.annotations.enums.SecuritySchemeType
import io.swagger.v3.oas.annotations.security.SecurityScheme
import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.examples.Example
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.media.ArraySchema
import io.swagger.v3.oas.models.media.IntegerSchema
import io.swagger.v3.oas.models.media.ObjectSchema
import io.swagger.v3.oas.models.media.Schema
import io.swagger.v3.oas.models.media.StringSchema
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
class ApiOpenApiConfig {

    @Bean
    fun apiOpenAPI(): OpenAPI {
        val errorDetailSchema = ObjectSchema()
            .addProperty("field", StringSchema().example("companyName").nullable(true))
            .addProperty("message", StringSchema().example("must not be blank"))
            .addProperty("reason", StringSchema().example("NotBlank").nullable(true))
            .addProperty("rejectedValue", StringSchema().example("").nullable(true))

        val errorEnvelope = ObjectSchema()
            .description("표준 에러 envelope. code 는 도메인 단위 숫자 (4xxx 클라이언트, 5xxx 서버).")
            .addProperty("code", IntegerSchema().example(4041))
            .addProperty("message", StringSchema().example("Request not found"))
            .addProperty("errors", ArraySchema().items(errorDetailSchema))
            .addProperty("traceId", StringSchema().nullable(true).example(null))
            .required(listOf("code", "message"))

        val errorExamples = mapOf(
            "validation-4000" to Example()
                .summary("400 Bad Request — validation")
                .value(mapOf(
                    "code" to 4000,
                    "message" to "Validation failed",
                    "errors" to listOf(mapOf(
                        "field" to "email",
                        "message" to "must not be blank",
                        "reason" to "NotBlank",
                        "rejectedValue" to ""
                    ))
                )),
            "unauthorized-4011" to Example()
                .summary("401 Unauthorized — invalid credentials")
                .value(mapOf("code" to 4011, "message" to "Invalid credentials")),
            "forbidden-4035" to Example()
                .summary("403 Forbidden — ownership/state violation")
                .value(mapOf("code" to 4035, "message" to "Not the request owner")),
            "not-found-4041" to Example()
                .summary("404 Not Found")
                .value(mapOf("code" to 4041, "message" to "Request not found")),
            "conflict-4091" to Example()
                .summary("409 Conflict — duplicate / state clash")
                .value(mapOf("code" to 4091, "message" to "Email already exists")),
            "unprocessable-4221" to Example()
                .summary("422 Unprocessable — state immutable")
                .value(mapOf("code" to 4221, "message" to "Profile not editable in current state")),
            "internal-5000" to Example()
                .summary("500 Internal Server Error")
                .value(mapOf("code" to 5000, "message" to "Internal server error"))
        )

        val successEnvelope = ObjectSchema()
            .description("표준 성공 envelope. 목록 응답일 때 meta 에 pagination 정보 포함.")
            .addProperty("code", IntegerSchema().example(100))
            .addProperty("message", StringSchema().example("Success"))
            .addProperty("data", ObjectSchema())
            .addProperty("meta", Schema<Any>().`$ref`("#/components/schemas/PaginationMeta").nullable(true))

        val paginationMeta = ObjectSchema()
            .addProperty("page", IntegerSchema().example(1))
            .addProperty("size", IntegerSchema().example(20))
            .addProperty("totalElements", IntegerSchema().format("int64").example(42))
            .addProperty("totalPages", IntegerSchema().example(3))
            .addProperty("hasNext", Schema<Any>().type("boolean").example(true))
            .addProperty("hasPrev", Schema<Any>().type("boolean").example(false))

        return OpenAPI()
            .info(
                Info()
                    .title("FSM API Server")
                    .version("0.2.0")
                    .description(
                        """
                        식품 B2B 매칭 플랫폼 (FSM) 의 구매사 · 공급사 API.

                        - 인증: 로그인 후 `Authorization: Bearer <JWT>` 헤더. 인증 필요 endpoint 는 자물쇠 아이콘 표시.
                        - 응답 envelope: 성공은 `ApiSuccessResponse`, 오류는 `ApiErrorResponse`.
                        - 에러 `code` 는 도메인 단위 4자리 숫자. 대표 예시는 `ApiErrorResponse` 스키마의 examples 참조.
                        """.trimIndent()
                    )
            )
            .components(
                Components()
                    .addSchemas("ApiSuccessResponse", successEnvelope)
                    .addSchemas("ApiErrorResponse", errorEnvelope)
                    .addSchemas("ApiErrorDetail", errorDetailSchema)
                    .addSchemas("PaginationMeta", paginationMeta)
                    .addExamples("ValidationError", errorExamples["validation-4000"])
                    .addExamples("UnauthorizedError", errorExamples["unauthorized-4011"])
                    .addExamples("ForbiddenError", errorExamples["forbidden-4035"])
                    .addExamples("NotFoundError", errorExamples["not-found-4041"])
                    .addExamples("ConflictError", errorExamples["conflict-4091"])
                    .addExamples("UnprocessableError", errorExamples["unprocessable-4221"])
                    .addExamples("InternalError", errorExamples["internal-5000"])
            )
    }
}
