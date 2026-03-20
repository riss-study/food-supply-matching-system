plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.spring.dependency.management)
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

dependencies {
    implementation(project(":shared-core"))
    implementation(project(":command-domain-request"))
    implementation(project(":command-domain-supplier"))
    implementation(project(":command-domain-thread"))
    implementation(libs.spring.boot.starter.data.r2dbc)
    implementation(libs.spring.boot.starter.webflux)

    testImplementation(libs.spring.boot.starter.test)
    testImplementation("io.projectreactor:reactor-test")
    testRuntimeOnly(libs.junit.platform.launcher)
}

tasks.withType<Test> {
    useJUnitPlatform()
}
