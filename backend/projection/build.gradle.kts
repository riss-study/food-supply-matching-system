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
    implementation(project(":command-domain-user"))
    implementation(project(":command-domain-supplier"))
    implementation(project(":command-domain-request"))
    implementation(project(":command-domain-quote"))
    implementation(project(":command-domain-thread"))
    implementation(project(":query-model-user"))
    implementation(project(":query-model-supplier"))
    implementation(project(":query-model-request"))
    implementation(project(":query-model-quote"))
    implementation(project(":query-model-thread"))
    implementation(project(":query-model-admin-review"))
    implementation(project(":query-model-admin-stats"))
    implementation(libs.spring.boot.starter.data.mongodb.reactive)
    implementation(libs.spring.boot.starter.data.r2dbc)
    runtimeOnly(libs.mariadb.r2dbc)

    testImplementation(libs.spring.boot.starter.test)
    testRuntimeOnly(libs.junit.platform.launcher)
}

tasks.withType<Test> {
    useJUnitPlatform()
}
