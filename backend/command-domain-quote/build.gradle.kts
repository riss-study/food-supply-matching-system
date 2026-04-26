plugins {
    alias(libs.plugins.kotlin.jvm)
    // kotlin-spring: @Service / @Transactional 등 Spring 어노테이션 붙은 class 를
    // 자동 open 으로 만들어 CGLIB proxy 생성 가능하게 함 (@Transactional 필요)
    alias(libs.plugins.kotlin.spring)
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
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.4.0")
    testRuntimeOnly(libs.junit.platform.launcher)
}

tasks.withType<Test> {
    useJUnitPlatform()
}
