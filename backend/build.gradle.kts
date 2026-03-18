plugins {
    alias(libs.plugins.kotlin.jvm) apply false
    alias(libs.plugins.kotlin.spring) apply false
    alias(libs.plugins.spring.boot) apply false
    alias(libs.plugins.spring.dependency.management) apply false
}

import io.spring.gradle.dependencymanagement.dsl.DependencyManagementExtension

allprojects {
    group = "dev.riss.fsm"
    version = "0.1.0-SNAPSHOT"

    repositories {
        mavenCentral()
    }
}

subprojects {
    pluginManager.withPlugin("io.spring.dependency-management") {
        extensions.configure(DependencyManagementExtension::class.java) {
            imports {
                mavenBom("org.springframework.boot:spring-boot-dependencies:4.0.2")
            }
        }
    }
}
