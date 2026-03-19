package dev.riss.fsm.api.auth

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Test
import org.springframework.security.access.prepost.PreAuthorize

class RoleSkeletonServiceTest {

    @Test
    fun requesterMethodHasRequesterRoleAnnotation() {
        val annotation = RoleSkeletonService::class.java.getMethod("requesterAccess").getAnnotation(PreAuthorize::class.java)
        assertNotNull(annotation)
        assertEquals("hasRole('REQUESTER')", annotation.value)
    }

    @Test
    fun adminMethodHasAdminRoleAnnotation() {
        val annotation = RoleSkeletonService::class.java.getMethod("adminAccess").getAnnotation(PreAuthorize::class.java)
        assertNotNull(annotation)
        assertEquals("hasRole('ADMIN')", annotation.value)
    }
}
