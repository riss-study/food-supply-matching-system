package dev.riss.fsm.projection.supplier

import dev.riss.fsm.command.supplier.CertificationRecordEntity
import dev.riss.fsm.command.supplier.SupplierProfileEntity
import dev.riss.fsm.query.supplier.SupplierDetailViewDocument
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
    fun project(profile: SupplierProfileEntity, certifications: List<CertificationRecordEntity>): Mono<Void> {
        val categories = profile.categories.split(',').filter { it.isNotBlank() }
        val detail = SupplierDetailViewDocument(
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
            certifications = certifications.map { it.type },
            updatedAt = profile.updatedAt.toInstant(ZoneOffset.UTC),
        )

        val detailWrite = supplierDetailViewRepository.save(detail)

        val searchWrite = if (profile.verificationState == "approved" && profile.exposureState == "visible") {
            supplierSearchViewRepository.save(
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
                    updatedAt = profile.updatedAt.toInstant(ZoneOffset.UTC),
                )
            ).then()
        } else {
            supplierSearchViewRepository.deleteById(profile.profileId).onErrorResume { Mono.empty() }
        }

        return detailWrite.then(searchWrite).then()
    }
}
