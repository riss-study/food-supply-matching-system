package dev.riss.fsm.api.request

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.Instant

data class CreateRequestPriceRange(
    @field:Min(1)
    val min: Int,
    @field:Min(1)
    val max: Int,
)

data class CreateRequestRequest(
    @field:Pattern(regexp = "^(public|targeted)$")
    val mode: String,
    @field:Size(min = 5, max = 200)
    val title: String,
    @field:NotBlank
    val category: String,
    @field:Min(1)
    @field:Max(1_000_000_000)
    val desiredVolume: Int,
    val targetPriceRange: CreateRequestPriceRange?,
    val certificationRequirement: List<String>?,
    @field:Pattern(regexp = "^(requester_provided|supplier_provided)?$")
    val rawMaterialRule: String?,
    @field:Pattern(regexp = "^(private_label|bulk|none)?$")
    val packagingRequirement: String?,
    val deliveryRequirement: String?,
    @field:Size(max = 2000)
    val notes: String?,
)

data class CreateRequestResponse(
    val requestId: String,
    val state: String,
    val createdAt: Instant,
)
