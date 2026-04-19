package dev.riss.fsm.api.review

import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.JsonSetter
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant

@Schema(description = "Create review request")
data class CreateReviewRequest(
    @field:NotBlank
    @Schema(description = "대상 의뢰 ID", example = "req_01HQX...")
    val requestId: String,
    @field:NotBlank
    @Schema(description = "대상 공급자 ID", example = "sprof_01HQX...")
    val supplierId: String,
    @field:Min(1)
    @field:Max(5)
    @Schema(description = "별점 1..5", example = "5")
    val rating: Int,
    @field:Size(max = 500)
    @Schema(description = "본문 (0-500자, 선택)", example = "품질·납기 모두 만족스러웠습니다.")
    val text: String?,
)

@Schema(description = "Update review request (partial). `text` 필드의 presence/null 을 구분하기 위해 `private set` + @JsonSetter 사용")
class UpdateReviewRequest {
    @field:Min(1)
    @field:Max(5)
    @Schema(description = "별점 1..5 (생략 시 기존 유지)")
    var rating: Int? = null

    @field:Size(max = 500)
    @Schema(description = "본문. null 또는 빈 문자열이면 본문 삭제, 생략하면 기존 유지")
    var text: String? = null
        private set

    @get:JsonIgnore
    var textProvided: Boolean = false
        private set

    @JsonSetter("text")
    fun applyText(value: String?) {
        this.text = value
        this.textProvided = true
    }
}

data class CreateReviewResponse(
    val reviewId: String,
    val rating: Int,
    val text: String?,
    val createdAt: Instant,
)

data class UpdateReviewResponse(
    val reviewId: String,
    val rating: Int,
    val text: String?,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class EligibilityResponse(
    val eligible: Boolean,
    val reason: String?,
)

data class ReviewListItem(
    val reviewId: String,
    val rating: Int,
    val text: String?,
    val authorDisplayName: String,
    val createdAt: Instant,
    val updatedAt: Instant,
)
