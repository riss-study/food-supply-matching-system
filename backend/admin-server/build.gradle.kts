plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.spring)
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

dependencies {
    implementation(project(":shared-core"))
    implementation(project(":projection"))
    implementation(project(":command-domain-user"))
    implementation(project(":command-domain-supplier"))
    implementation(project(":command-domain-request"))
    implementation(project(":command-domain-quote"))
    implementation(project(":command-domain-thread"))
    implementation(project(":command-domain-notice"))
    implementation(project(":query-model-user"))
    implementation(project(":query-model-supplier"))
    implementation(project(":query-model-request"))
    implementation(project(":query-model-quote"))
    implementation(project(":query-model-thread"))
    implementation(project(":query-model-admin-review"))
    implementation(project(":query-model-admin-stats"))

    implementation(libs.spring.boot.starter.webflux)
    implementation(libs.spring.boot.starter.webflux.actuator)
    implementation(libs.spring.boot.starter.data.r2dbc)
    implementation(libs.spring.boot.starter.data.mongodb.reactive)
    implementation(libs.spring.boot.starter.security)
    implementation(libs.spring.boot.starter.validation)
    implementation(libs.reactor.kotlin.extensions)
    implementation(libs.kotlin.reflect)
    implementation(libs.kotlinx.coroutines.reactor)
    implementation(libs.jackson.module.kotlin)
    implementation(libs.springdoc.webflux.api)
    implementation(libs.swagger.ui.webjar)
    implementation(libs.jjwt.api)

    runtimeOnly(libs.mariadb.r2dbc)
    runtimeOnly(libs.jjwt.impl)
    runtimeOnly(libs.jjwt.jackson)

    testImplementation(libs.spring.boot.starter.test)
    testImplementation(libs.spring.boot.starter.webflux.test)
    testImplementation(libs.spring.security.test)
    testRuntimeOnly(libs.junit.platform.launcher)
    testRuntimeOnly(libs.r2dbc.h2)
}

tasks.withType<Test> {
    useJUnitPlatform()
}
