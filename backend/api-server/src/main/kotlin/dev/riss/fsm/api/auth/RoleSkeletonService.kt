package dev.riss.fsm.api.auth

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service

@Service
class RoleSkeletonService {

    @PreAuthorize("hasRole('REQUESTER')")
    fun requesterAccess(): String = "requester-ok"

    @PreAuthorize("hasRole('SUPPLIER')")
    fun supplierAccess(): String = "supplier-ok"

    @PreAuthorize("hasRole('ADMIN')")
    fun adminAccess(): String = "admin-ok"
}
