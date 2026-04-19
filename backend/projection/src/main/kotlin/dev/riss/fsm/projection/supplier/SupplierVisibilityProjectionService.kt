package dev.riss.fsm.projection.supplier

import dev.riss.fsm.command.supplier.CertificationRecordEntity
import dev.riss.fsm.command.supplier.AttachmentMetadataEntity
import dev.riss.fsm.command.supplier.SupplierProfileEntity
import dev.riss.fsm.query.supplier.SupplierDetailViewDocument
import dev.riss.fsm.query.supplier.SupplierCertificationViewItem
import dev.riss.fsm.query.supplier.SupplierPortfolioImageViewItem
import dev.riss.fsm.query.supplier.SupplierDetailViewRepository
import dev.riss.fsm.query.supplier.SupplierSearchViewDocument
import dev.riss.fsm.query.supplier.SupplierSearchViewRepository
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.ZoneOffset

@Service
class SupplierVisibilityProjectionService(
    private val supplierSearchViewRepository: SupplierSearchViewRepository,
    private val supplierDetailViewRepository: SupplierDetailViewRepository,
) {
    fun project(
        profile: SupplierProfileEntity,
        certifications: List<CertificationRecordEntity>,
        attachments: List<AttachmentMetadataEntity> = emptyList(),
    ): Mono<Void> {
        val categories = profile.categories.split(',').filter { it.isNotBlank() }
        val portfolioImages = attachments
            .filter { it.attachmentKind == "portfolio" }
            .map {
                SupplierPortfolioImageViewItem(
                    imageId = it.attachmentId,
                    url = "/files/${it.attachmentId}",
                )
            }
        val certItems = certifications.map {
            SupplierCertificationViewItem(
                type = it.type,
                number = it.number,
                valid = it.status == "submitted" || it.status == "approved",
            )
        }
        val updatedAt = profile.updatedAt.toInstant(ZoneOffset.UTC)

        val detailWrite = supplierDetailViewRepository.findById(profile.profileId)
            .defaultIfEmpty(
                SupplierDetailViewDocument(
                    profileId = profile.profileId,
                    companyName = profile.companyName,
                    representativeName = profile.representativeName,
                    region = profile.region,
                    categories = categories,
                    equipmentSummary = profile.equipmentSummary,
                    monthlyCapacity = profile.monthlyCapacity,
                    moq = profile.moq,
                    oemAvailable = profile.oemAvailable,
                    odmAvailable = profile.odmAvailable,
                    rawMaterialSupport = profile.rawMaterialSupport,
                    packagingLabelingSupport = profile.packagingLabelingSupport,
                    introduction = profile.introduction,
                    verificationState = profile.verificationState,
                    exposureState = profile.exposureState,
                    logoUrl = portfolioImages.firstOrNull()?.url,
                    certifications = certItems,
                    portfolioImages = portfolioImages,
                    updatedAt = updatedAt,
                )
            )
            .flatMap { existing ->
                supplierDetailViewRepository.save(
                    existing.copy(
                        companyName = profile.companyName,
                        representativeName = profile.representativeName,
                        region = profile.region,
                        categories = categories,
                        equipmentSummary = profile.equipmentSummary,
                        monthlyCapacity = profile.monthlyCapacity,
                        moq = profile.moq,
                        oemAvailable = profile.oemAvailable,
                        odmAvailable = profile.odmAvailable,
                        rawMaterialSupport = profile.rawMaterialSupport,
                        packagingLabelingSupport = profile.packagingLabelingSupport,
                        introduction = profile.introduction,
                        verificationState = profile.verificationState,
                        exposureState = profile.exposureState,
                        logoUrl = portfolioImages.firstOrNull()?.url,
                        certifications = certItems,
                        portfolioImages = portfolioImages,
                        updatedAt = updatedAt,
                    )
                )
            }

        val searchWrite: Mono<Void> = if (profile.verificationState == "approved" && profile.exposureState == "visible") {
            supplierSearchViewRepository.findById(profile.profileId)
                .defaultIfEmpty(
                    SupplierSearchViewDocument(
                        profileId = profile.profileId,
                        companyName = profile.companyName,
                        region = profile.region,
                        categories = categories,
                        monthlyCapacity = profile.monthlyCapacity,
                        moq = profile.moq,
                        oemAvailable = profile.oemAvailable,
                        odmAvailable = profile.odmAvailable,
                        verificationState = profile.verificationState,
                        exposureState = profile.exposureState,
                        logoUrl = portfolioImages.firstOrNull()?.url,
                        updatedAt = updatedAt,
                    )
                )
                .flatMap { existing ->
                    supplierSearchViewRepository.save(
                        existing.copy(
                            companyName = profile.companyName,
                            region = profile.region,
                            categories = categories,
                            monthlyCapacity = profile.monthlyCapacity,
                            moq = profile.moq,
                            oemAvailable = profile.oemAvailable,
                            odmAvailable = profile.odmAvailable,
                            verificationState = profile.verificationState,
                            exposureState = profile.exposureState,
                            logoUrl = portfolioImages.firstOrNull()?.url,
                            updatedAt = updatedAt,
                        )
                    )
                }
                .then()
        } else {
            supplierSearchViewRepository.deleteById(profile.profileId).onErrorResume { Mono.empty() }
        }

        return detailWrite.then(searchWrite).then()
    }
}
