package dev.riss.fsm.admin.config

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
class AdminOpenApiConfig {

    @Bean
    fun adminOpenAPI(): OpenAPI {
        val errorDetailSchema = ObjectSchema()
            .addProperty("field", StringSchema().nullable(true))
            .addProperty("message", StringSchema().example("must not be blank"))
            .addProperty("reason", StringSchema().nullable(true))
            .addProperty("rejectedValue", StringSchema().nullable(true))

        val errorEnvelope = ObjectSchema()
            .description("표준 에러 envelope. code 는 도메인 단위 숫자 (4xxx 클라이언트, 5xxx 서버).")
            .addProperty("code", IntegerSchema().example(4041))
            .addProperty("message", StringSchema().example("Resource not found"))
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
                        "field" to "note",
                        "message" to "must not be blank",
                        "reason" to "NotBlank"
                    ))
                )),
            "unauthorized-4011" to Example()
                .summary("401 Unauthorized — invalid credentials")
                .value(mapOf("code" to 4011, "message" to "Invalid credentials")),
            "forbidden-4030" to Example()
                .summary("403 Forbidden — not an admin")
                .value(mapOf("code" to 4030, "message" to "Admin role required")),
            "not-found-4041" to Example()
                .summary("404 Not Found")
                .value(mapOf("code" to 4041, "message" to "Review not found")),
            "conflict-4092" to Example()
                .summary("409 Conflict — state clash")
                .value(mapOf("code" to 4092, "message" to "Review already decided")),
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
            .addProperty("totalElements", IntegerSchema().format("int64").example(8))
            .addProperty("totalPages", IntegerSchema().example(1))
            .addProperty("hasNext", Schema<Any>().type("boolean").example(false))
            .addProperty("hasPrev", Schema<Any>().type("boolean").example(false))

        return OpenAPI()
            .info(
                Info()
                    .title("FSM Admin Server")
                    .version("0.2.0")
                    .description(
                        """
                        FSM 관리자용 API. 공급사/사업자 검수, 공지 관리, 통계 집계를 제공.

                        - 인증: 관리자 전용. 로그인 후 `Authorization: Bearer <JWT>` 필요.
                        - 모든 `/api/admin/**` endpoint 는 ADMIN 역할을 요구 (로그인 시 차단됨).
                        - 응답 envelope 는 api-server 와 동일 규약.
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
                    .addExamples("ForbiddenError", errorExamples["forbidden-4030"])
                    .addExamples("NotFoundError", errorExamples["not-found-4041"])
                    .addExamples("ConflictError", errorExamples["conflict-4092"])
                    .addExamples("InternalError", errorExamples["internal-5000"])
            )
    }
}
