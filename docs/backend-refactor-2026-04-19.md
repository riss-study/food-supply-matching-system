# 백엔드 리팩토링 노트 — 2026-04-19

> 한 세션에서 진행한 백엔드 개선 사항을 커밋별 before/after + 왜 그렇게 바꿨는지로 정리.
> 지침: `docs/REFACTORING-GUIDELINES.ko.md` §3

---

## 커밋 요약

| # | SHA | 주제 | 규모 |
|---|---|---|---|
| 1 | `8ec62ab` | StorageProperties 외부화 + 누적 test drift 청소 | S+정리 |
| 2 | `b86294d` | polish — `var`/`!!` 제거, URL helper 추출 | S |
| 3 | `676566c` | API 에러 코드 fallback 규약 문서화 | S (docs) |
| 4 | `3c4edc5` | supplier category/region count → Mongo aggregation | M (perf) |
| 5 | `09b4e46` | `@Transactional` 을 domain → application layer 로 이동 | M |
| 6 | `6b536a5` | `command-domain-*` 의 `ResponseStatusException` → 도메인 sealed exception | L |

검증 공통: `./gradlew test` 전 모듈 **BUILD SUCCESSFUL** + 공인 IP × 3역할 E2E curl 전부 200.

---

## 1. `8ec62ab` — StorageProperties 외부화 + test drift 정리

### 배경
- 두 앱(api-server, admin-server)이 동일 설정 키 `fsm.storage.local-root` 를 **각각 `@Value` 단건 주입**으로 받음. 타입 안전성 없음. 기본값도 두 곳에 중복(`"backend/local-storage"`).
- 지침서 §3.2 "타입 안전 설정은 `@ConfigurationProperties` 사용. `@Value` 단건 주입은 최소화" 위반.
- 추가로 `./gradlew test` 가 전 모듈 **한 번도 통과한 적 없는 상태**. 주된 원인 3가지가 얽혀 있었고, 이번에 전부 청소.

### 변경 A: `StorageProperties` 추가 (shared-core)

**신규 파일** `backend/shared-core/src/main/kotlin/dev/riss/fsm/shared/file/StorageProperties.kt`:

```kotlin
package dev.riss.fsm.shared.file

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "fsm.storage")
data class StorageProperties(
    val localRoot: String = "backend/local-storage",
)
```

### 변경 B: `@Value` 주입 → `StorageProperties`

**LocalFileStorageService.kt** (api-server)

Before:
```kotlin
import org.springframework.beans.factory.annotation.Value
...
@Service
class LocalFileStorageService(
    @Value("\${fsm.storage.local-root:backend/local-storage}") private val localRoot: String,
) : FileStorageService {
    ...
}
```

After:
```kotlin
import dev.riss.fsm.shared.file.StorageProperties
...
@Service
class LocalFileStorageService(
    storageProperties: StorageProperties,
) : FileStorageService {
    private val localRoot: String = storageProperties.localRoot
    ...
}
```

**NoticeApplicationService.kt** (admin-server): 동일 패턴.

### 변경 C: Application 메인에 등록

Before (양 앱 공통):
```kotlin
@SpringBootApplication(scanBasePackages = ["dev.riss.fsm"])
@EnableConfigurationProperties(JwtProperties::class)
```

After:
```kotlin
@SpringBootApplication(scanBasePackages = ["dev.riss.fsm"])
@EnableConfigurationProperties(JwtProperties::class, StorageProperties::class)
```

### 왜

- **단일 출처**: 같은 설정 키의 기본값·타입을 한 파일(Class) 에서만 관리.
- **타입 안전**: 오타나 타입 mismatch 가 compile 단계에서 잡힘.
- **확장성**: 향후 `maxFileSize`, `allowedContentTypes` 같은 storage 관련 추가 설정이 들어오면 같은 `StorageProperties` 에 필드만 추가.
- **지침서 §3.2 준수**: `@Value` 단건 주입을 기본값 포함 두 서비스가 중복 선언하던 상태를 해소.

### 변경 D: 누적 test drift 청소

원격의 과거 typing pass(`8f05721`, `5000ced`)에서 entity/command 의 `desiredVolume/monthlyCapacity/moq/unitPriceEstimate/leadTime/sampleCost/targetPriceMin/targetPriceMax` 필드를 `Int` → `String` 으로 전환했으나, **테스트 fixture 가 여전히 `Int` 리터럴을 사용**해 compile 조차 안 되던 상태였다. 이번 storage 변경이 `NoticeApplicationServiceTest` 생성자 시그니처에 닿아 처음으로 drift 가 드러났고, 연쇄적으로 정리.

Before (예: `AdminStatsApplicationServiceTest.kt`):
```kotlin
monthlyCapacity = 1000,
moq = 100,
```

After:
```kotlin
monthlyCapacity = "1000",
moq = "100",
```

`QuoteCommandServiceTest`, `QuoteApplicationServiceTest`, `RequestAccessGuardTest`, `SupplierProfileControllerTest`, `ThreadApplicationServiceTest`, `RequestControllerTest` 등에 일괄 적용 (sed 로 처리).

`SubmitQuoteCommand` positional 숫자 인자도 동일 원칙으로 문자열화:

Before:
```kotlin
SubmitQuoteCommand(request.requestId, "sprof_1", 800, 2000, 30, null, null)
```

After:
```kotlin
SubmitQuoteCommand(request.requestId, "sprof_1", "800", "2000", "30", null, null)
```

assertion 도 교정:

Before (`RequestCommandServiceTest.kt`):
```kotlin
assertEquals(2000, result.desiredVolume)
```

After:
```kotlin
assertEquals("2000", result.desiredVolume)
```

### 변경 E: admin-server 테스트 환경 수리

**문제 1**: `admin-server/src/test/resources/application.yml` 이 아예 없음. 테스트 컨텍스트 로드 시 `${SECURITY_JWT_SECRET}` placeholder 가 해석 못 되어 22-byte 문자열이 키로 전달, HMAC-SHA 256비트 요구사항 위반으로 context 로드 실패.

**조치**: api-server 의 test yml 과 동일 포맷으로 신규 작성. H2 in-memory r2dbc + mongo autoconfigure exclude + 32자 JWT test secret.

**문제 2**: `admin-server/build.gradle.kts` 에 `testRuntimeOnly(libs.r2dbc.h2)` 가 없음 (api-server 에는 있음). H2 드라이버 부재로 test context 가 connection factory 생성 실패.

Before (`admin-server/build.gradle.kts`):
```kotlin
testImplementation(libs.spring.boot.starter.test)
testImplementation(libs.spring.boot.starter.webflux.test)
testImplementation(libs.spring.security.test)
testRuntimeOnly(libs.junit.platform.launcher)
```

After:
```kotlin
testImplementation(libs.spring.boot.starter.test)
testImplementation(libs.spring.boot.starter.webflux.test)
testImplementation(libs.spring.security.test)
testRuntimeOnly(libs.junit.platform.launcher)
testRuntimeOnly(libs.r2dbc.h2)
```

**문제 3**: `NoticeApplicationServiceTest` 의 stale 기대값.

Before:
```kotlin
assertEquals("notice/${entity.noticeId}/ops-guide.pdf", response.attachments.first().url)
```
실제 실행 결과는 `/api/admin/notices/{noticeId}/attachments/{attachmentId}/download` 형태. 기대값이 옛날 storageKey 포맷에 머물러 있었음.

After:
```kotlin
val attachment = response.attachments.first()
assertEquals("ops-guide.pdf", attachment.fileName)
assertEquals(
    "/api/admin/notices/${entity.noticeId}/attachments/${attachment.attachmentId}/download",
    attachment.url,
)
```

**문제 4**: `JwtTokenProviderTest` 가 `JwtProperties()` 기본 생성자 호출. `secret: String` 은 기본값 없어 생성 실패.

Before:
```kotlin
private val provider = JwtTokenProvider(JwtProperties())
```

After:
```kotlin
private val provider = JwtTokenProvider(JwtProperties(secret = "jwt-test-secret-jwt-test-secret-32"))
```

### 왜 (test 정리 파트)

- 내 storage 변경이 `NoticeApplicationServiceTest` 생성자에 닿아 compile 이 풀렸고, 그 뒤 연쇄적으로 **기존부터 broken 이던 상태**가 드러남.
- "사이드이펙트 검증하며 진행" 원칙상, 테스트가 시도조차 못 하는 상태를 그냥 둘 수 없음.
- 사이드이펙트가 아닌 drift 이지만 같은 커밋에 포함한 이유: 이번 변경으로 최초 노출된 에러들이므로 분리하면 리뷰어가 "storage 변경이 test 를 깬 것처럼 보이는" 착시가 생김. 커밋 메시지에 명시적으로 "누적 부채" 로 기록.

### 검증

`./gradlew test` 최초로 전 모듈 **BUILD SUCCESSFUL**.

---

## 2. `b86294d` — polish (var / `!!` / URL 하드코딩)

### 변경 A: `var` 불필요 제거

**`NoticeApplicationService.list()`**

Before:
```kotlin
}).map { documents ->
    var filtered = documents
    if (parsedFrom != null) filtered = filtered.filter { it.createdAt >= parsedFrom }
    if (parsedTo != null) filtered = filtered.filter { it.createdAt < parsedTo }
    filtered
}
```

After:
```kotlin
}).map { documents ->
    documents
        .filter { parsedFrom == null || it.createdAt >= parsedFrom }
        .filter { parsedTo == null || it.createdAt < parsedTo }
}
```

### 왜
- Kotlin 관용 (§3.10): `val` 우선, `var` 는 상태 변이 불가피할 때만.
- 여기서 `filtered` 는 단계별 변수 재할당. filter 체인으로 표현하면 **결과만 표현**되고 중간 상태가 사라짐.
- 동일 로직·동일 런타임, 읽기 쉬움.

### 변경 B: `!!` non-null assertion 제거

**`SupplierQueryService.listApproved()`**

Before:
```kotlin
.filter { item ->
    query.minCapacity == null || run {
        val n = item.monthlyCapacity.filter { it.isDigit() }.toIntOrNull() ?: 0
        n >= query.minCapacity!!
    }
}
```

After:
```kotlin
.filter { item ->
    val min = query.minCapacity ?: return@filter true
    val n = item.monthlyCapacity.filter { it.isDigit() }.toIntOrNull() ?: 0
    n >= min
}
```

`maxMoq` 도 동일 패턴으로.

### 왜
- 지침서 §3.10: "`!!` 거의 금지. 필요하면 `requireNotNull` + 메시지".
- 바로 위에서 `== null` 체크 했어도 `!!` 는 future refactor 가 null check 를 놓치면 NPE. `?:` + early-return 으로 **non-null narrowing 을 Kotlin 이 보장**.
- 의미도 더 직접적: "null 이면 필터 통과, 값이 있으면 비교".

### 변경 C: URL 하드코딩 제거

**`NoticeApplicationService.kt`** 에 같은 URL 포맷 2곳:

Before:
```kotlin
// 업로드 직후
url = "/api/admin/notices/$noticeId/attachments/${saved.attachmentId}/download",
// ...
// 목록 조회 시
url = "/api/admin/notices/${it.ownerId}/attachments/${it.attachmentId}/download",
```

After:
```kotlin
private fun noticeAttachmentDownloadUrl(noticeId: String, attachmentId: String): String =
    "/api/admin/notices/$noticeId/attachments/$attachmentId/download"

// 호출부
url = noticeAttachmentDownloadUrl(noticeId, saved.attachmentId),
// ...
url = noticeAttachmentDownloadUrl(it.ownerId, it.attachmentId),
```

### 왜
- §1.1 SSOT: 같은 URL 포맷이 2곳에 있으면 리팩토링 대상. 라우팅 변경 시 두 곳 다 고쳐야 하고 한쪽 빠뜨리면 silent bug.
- private helper 로 묶어 의미있는 이름 부여.
- 향후 이 URL 패턴이 controller 쪽 path 정의와 어긋나면 한 곳만 수정.

---

## 3. `676566c` — API 에러 코드 fallback 규약 문서화

### 배경
`GlobalApiExceptionHandler.handleResponseStatus()` 가 매핑되지 않은 `ResponseStatusException` 에 대해 `code = statusCode.value() * 10` 을 사용. 이 공식은 4자리 규약(예: 404→4040)과 수학적으로 일치하나, 규약 문서(`api-spec.md`)에 **명시 안 됨**.

새로운 도메인 code 를 추가할 때 "4030 은 뭘 의미하지?" 같은 혼란 가능. Fallback 범위를 명시해 정합성 유지.

### 변경

**`.sisyphus/drafts/api-spec.md` §2.5** 에 code 규약 추가:

```markdown
**Code 규약**:
- 성공: `code = 100` (고정)
- 4자리 정수. 도메인별 specific code 는 §5 에 정의
- 매핑되지 않은 `ResponseStatusException` 은 fallback 으로 `HTTP status × 10`
  을 사용 (예: 404 → `4040`, 500 → `5000`). 새 도메인 code 추가 시 이 범위와
  겹치지 않도록 할당 (예: 403 대역은 `4031~4039`, fallback `4030` 은 예약).
```

### 왜
- 이미 구현은 존재하나 **암묵적 규약**. 새 도메인 예외를 추가하는 개발자가 4030 같은 숫자를 무심코 할당하면 fallback 과 겹침.
- 코드 규약은 "사람이 읽어야 따를 수 있는" 것이라 문서화가 중요.
- 코드를 바꾸지 않고 문서만 업데이트한 이유: 실제 동작은 이미 규약과 일치하기 때문. 바꿀 필요가 없고 바꾸면 기존 클라이언트 깨짐.

---

## 4. `3c4edc5` — category/region count → Mongo aggregation

### 배경
`SupplierQueryService.categories()` / `regions()` 가 `supplier_search_view` 전체 문서를 **메모리에 로드**한 뒤 `groupingBy/eachCount` 로 집계. 현재 seed 데이터는 몇 건이라 성능 이슈 없지만, **데이터 증가 시 선형 대역·메모리 증가**. 지침서 §3.6 "unbounded 쿼리 금지" 의 잠재 위반.

### 변경 A: Repository 에 `@Aggregation` 추가

**`SupplierViewRepositories.kt`**

Before:
```kotlin
interface SupplierSearchViewRepository : ReactiveMongoRepository<SupplierSearchViewDocument, String>
```

After:
```kotlin
interface SupplierSearchViewRepository : ReactiveMongoRepository<SupplierSearchViewDocument, String> {

    @Aggregation(
        pipeline = [
            "{ \$unwind: '\$categories' }",
            "{ \$group: { _id: '\$categories', supplierCount: { \$sum: 1 } } }",
            "{ \$project: { _id: 0, category: '\$_id', supplierCount: 1 } }",
            "{ \$sort: { category: 1 } }",
        ],
    )
    fun aggregateCategoryCounts(): Flux<SupplierCategoryCountProjection>

    @Aggregation(
        pipeline = [
            "{ \$group: { _id: '\$region', supplierCount: { \$sum: 1 } } }",
            "{ \$project: { _id: 0, region: '\$_id', supplierCount: 1 } }",
            "{ \$sort: { region: 1 } }",
        ],
    )
    fun aggregateRegionCounts(): Flux<SupplierRegionCountProjection>
}

data class SupplierCategoryCountProjection(val category: String, val supplierCount: Int)
data class SupplierRegionCountProjection(val region: String, val supplierCount: Int)
```

### 변경 B: Service 를 aggregation 호출로

**`SupplierQueryService.kt`**

Before:
```kotlin
fun categories(): Mono<List<SupplierCategorySummary>> {
    return supplierSearchViewRepository.findAll()
        .collectList()
        .map { items ->
            items.flatMap { it.categories }
                .groupingBy { it }
                .eachCount()
                .entries
                .sortedBy { it.key }
                .map { SupplierCategorySummary(category = it.key, supplierCount = it.value) }
        }
}

fun regions(): Mono<List<SupplierRegionSummary>> {
    return supplierSearchViewRepository.findAll()
        .collectList()
        .map { items ->
            items.groupingBy { it.region }
                .eachCount()
                .entries
                .sortedBy { it.key }
                .map { SupplierRegionSummary(region = it.key, supplierCount = it.value) }
        }
}
```

After:
```kotlin
fun categories(): Mono<List<SupplierCategorySummary>> =
    supplierSearchViewRepository.aggregateCategoryCounts()
        .map { SupplierCategorySummary(category = it.category, supplierCount = it.supplierCount) }
        .collectList()

fun regions(): Mono<List<SupplierRegionSummary>> =
    supplierSearchViewRepository.aggregateRegionCounts()
        .map { SupplierRegionSummary(region = it.region, supplierCount = it.supplierCount) }
        .collectList()
```

### 왜
- **DB-side 집계**: 네트워크 전송량이 "전체 문서" → "고유 카테고리/지역 개수" 로 축소. 예를 들어 공급자 10,000 건에 카테고리가 8 종이면 8 개 row 만 전송.
- **메모리 점유**: 애플리케이션 힙에 10,000 문서 로드하지 않음.
- **정렬/프로젝션 일관**: 같은 pipeline 이 DB 에서 실행되므로 service 코드가 단순. 서비스는 "DTO 로 매핑" 역할만.
- **응답 계약 변화 없음**: `SupplierCategorySummary` / `SupplierRegionSummary` 그대로. API 스펙 영향 0.

### listApproved 는 왜 아직

`listApproved` 는 `keyword / category / region / oem / odm / capacity / moq` 조합 필터 + 문자열 유사 검색 + 문자열 내 숫자 추출 필터 등이 얽혀 있음. aggregation pipeline 으로 옮기려면 pipeline stage 가 6~7개 필요하고, 일부는 MongoDB 텍스트 인덱스 고려가 필요. **데이터 증가 시** 별도 티켓으로 설계 예정.

### 검증
- `./gradlew test` BUILD SUCCESSFUL
- `GET /api/suppliers/categories` 응답 예:
  ```json
  {"code":100,"message":"Success","data":[
    {"category":"bakery","supplierCount":1},
    {"category":"beverage","supplierCount":1},
    {"category":"frozen","supplierCount":1},
    {"category":"snack","supplierCount":2}
  ]}
  ```
- 기존 메모리 구현 결과와 동일 (seed 기반 카운트).

---

## 5. `09b4e46` — `@Transactional` 을 domain → application layer 로 이동

### 배경
`NoticeCommandService` (command-domain-notice) 의 5개 쓰기 메소드에 전부 `@Transactional` 이 붙어 있었음.

```kotlin
@Service
class NoticeCommandService(
    private val noticeRepository: NoticeRepository,
) {
    @Transactional
    fun createNotice(...): Mono<NoticeEntity> { ... }

    @Transactional
    fun updateNotice(...): Mono<NoticeEntity> { ... }

    @Transactional
    fun publishNotice(...): Mono<NoticeEntity> { ... }

    @Transactional
    fun archiveNotice(...): Mono<NoticeEntity> { ... }

    @Transactional
    fun changeState(...): Mono<NoticeEntity> { ... }
}
```

**지침서 §3.7 위반**:
> "`@Transactional` 은 application service. domain/repository 에 걸지 않는다."

Request / Quote / Supplier / Thread 도메인은 이미 application layer 에 두고 있었고, Notice 만 잘못된 위치.

### 왜 이 원칙이 중요한가
1. **트랜잭션 경계는 유즈케이스 단위**. 단일 도메인 save 뿐 아니라 "공지 생성 + Mongo view 반영" 같은 여러 step 을 **하나의 원자 단위**로 묶어야 할 때가 많다. 도메인 레이어가 단일 repository 만 건드리는 지금 단계에선 결과가 같아 보여도, 유즈케이스가 커지는 순간 도메인의 `@Transactional` 은 "부분 트랜잭션" 만 보장하게 된다.
2. **도메인은 프레임워크 독립** (§3.4). `@Transactional` 은 Spring 관심사. 도메인이 이걸 알면 테스트에서도 Spring context 가 필요해지고, 순수 unit test 를 못 쓴다 (→ §10 숙제와 직결).
3. **의도 가시성**: application service 의 `create()` 에 `@Transactional` 이 붙어 있으면 "이 유즈케이스가 원자 단위" 가 한눈에 드러남. 도메인에 분산되어 있으면 호출 그래프를 따라가야 알 수 있다.

### 변경 A: domain 에서 `@Transactional` 전부 제거

**`NoticeCommandService.kt`**

Before:
```kotlin
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import reactor.core.publisher.Mono
...

@Service
class NoticeCommandService(
    private val noticeRepository: NoticeRepository,
) {

    @Transactional
    fun createNotice(...): Mono<NoticeEntity> { ... }

    @Transactional
    fun updateNotice(...): Mono<NoticeEntity> { ... }

    @Transactional
    fun publishNotice(...): Mono<NoticeEntity> { ... }

    @Transactional
    fun archiveNotice(...): Mono<NoticeEntity> { ... }

    @Transactional
    fun changeState(...): Mono<NoticeEntity> { ... }
}
```

After:
```kotlin
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
...

@Service
class NoticeCommandService(
    private val noticeRepository: NoticeRepository,
) {

    fun createNotice(...): Mono<NoticeEntity> { ... }
    fun updateNotice(...): Mono<NoticeEntity> { ... }
    fun publishNotice(...): Mono<NoticeEntity> { ... }
    fun archiveNotice(...): Mono<NoticeEntity> { ... }
    fun changeState(...): Mono<NoticeEntity> { ... }
}
```

`org.springframework.transaction.annotation.Transactional` import 도 제거.

### 변경 B: application layer 에 `@Transactional` 적용

**`NoticeApplicationService.kt`** (admin-server)

`import org.springframework.transaction.annotation.Transactional` 추가 후 **쓰기 유즈케이스** 네 개에 annotation 부여:

```kotlin
@Transactional
fun create(...): Mono<CreateNoticeResponse> { ... }

@Transactional
fun update(...): Mono<UpdateNoticeResponse> { ... }

@Transactional
fun uploadAttachment(...): Mono<NoticeAttachmentResponse> { ... }

@Transactional
fun deleteAttachment(...): Mono<Void> { ... }
```

읽기 전용 (`list`, `detail`, `getAttachmentFile`) 에는 부여하지 않음. 필요 시 `@Transactional(readOnly = true)` 로 나중에 튜닝.

### R2DBC reactive transaction 메모

- Spring Boot R2DBC autoconfigure 가 `ReactiveTransactionManager` 를 제공하므로 `@Transactional` 은 reactor `Mono`/`Flux` 체인에 그대로 적용됨 (transaction context 가 Reactor Context 로 전파).
- 단 Mongo 호출 (`adminNoticeViewRepository.save(...)` 등) 은 **별도 TM (MongoDB)** 이라 같은 `@Transactional` 에 묶이지 않음 — 이건 현 프로젝트가 **CQRS + 2개 저장소** 구조라 원래 불가능. 이번 변경은 "R2DBC 트랜잭션 경계를 application 경계와 일치" 시키는 것이 목적이며, Mongo projection 은 기존처럼 after-save 로 수행 (실패 시 보정 로직은 별도 과제).

### 검증

- `./gradlew test` BUILD SUCCESSFUL (전 모듈)
- admin-server 재기동 후 공지 lifecycle E2E (공인 IP `:5174`):
  - POST /api/admin/notices → `code 100`
  - PATCH /api/admin/notices/{id} (title only) → `100`
  - PATCH state=published → `100`
  - PATCH state=archived → `100`

### 남은 것
다른 도메인은 원래 application layer 에서 `@Transactional` 사용 중이거나 단일 save 만이라 annotation 없음. 이번 변경은 "Notice 만 어긋나 있던 것" 을 정합화한 수준. 유즈케이스가 복잡해져서 "하나의 원자 단위" 범위가 명확해지면 각 application service 의 `@Transactional` 을 재검토.

---

## 6. `6b536a5` — `command-domain-*` 의 `ResponseStatusException` → 도메인 sealed exception

### 배경
- 6개 command-domain 서비스 (`RequestCommandService`, `QuoteCommandService`, `SupplierProfileCommandService`, `ThreadCommandService`, `RequesterBusinessProfileCommandService`, `AuthCommandService`) 가 총 **28 곳** 에서 `org.springframework.web.server.ResponseStatusException` 을 `throw` 하고 있었다.
- 지침서 §3.1 "CQRS 경계 위반 — 도메인 서비스에서 HTTP/응답 타입 직접 사용" 에 직접 해당. 도메인 모듈이 Spring WebFlux 타입을 알면 순수 단위 테스트가 불가능해지고, 도메인 불변식 위반을 "HTTP status" 로만 표현하게 된다.
- 일부 도메인 (Quote / Thread) 은 이미 `shared-core/error/` 에 sealed exception 을 쓰고 있었지만 **부분적**. Request / Supplier / Business / Auth / Message 부분은 전부 `ResponseStatusException`.
- 문제는 도메인뿐 아니라 **테스트** 도 `assertTrue(error is ResponseStatusException)` + `HttpStatus.FORBIDDEN` 비교로 얽혀 있어 일괄 교체 필요.

### 설계 원칙
1. **의미 단위로 클래스**: "NotFound / OwnershipMismatch / StateTransition / AlreadyExists / InvalidCredentials" 같이 **무엇이 틀렸는가** 를 이름에 담는다.
2. **Handler 한 곳 집중**: `GlobalApiExceptionHandler` (`shared-core`) 에만 exception → (HTTP status + code + message) 매핑을 둔다. 도메인은 exception 을 던질 뿐.
3. **Code 는 기존 `api-spec.md §5.1` 재활용**: 이미 문서화된 code 숫자 (4011, 4032, 4033, 4035, 4041, 4091~4093, 4221, 4223, 5001, 4004) 에 exception 을 매핑. 새 숫자 추가 없음.

### 변경 A: 신규 exception 파일 5개 + Thread 확장 (`shared-core/error/`)

```kotlin
// RequestExceptions.kt
class RequestNotFoundException(override val message: String = "Request not found") : RuntimeException(message)
class RequestAccessForbiddenException(override val message: String = "Not the request owner") : RuntimeException(message)
class RequestStateTransitionException(override val message: String) : RuntimeException(message)

// QuoteOwnershipExceptions.kt (기존 QuoteSubmission/UpdateForbidden 은 유지)
class QuoteNotFoundException(override val message: String = "Quote not found") : RuntimeException(message)
class QuoteOwnerMismatchException(override val message: String = "Not the quote owner") : RuntimeException(message)

// SupplierProfileExceptions.kt
class SupplierProfileAlreadyExistsException(...)
class SupplierProfileNotFoundException(...)
class ApprovedSupplierProfileImmutableException(...)
class SupplierProfileStateImmutableException(...)

// BusinessProfileExceptions.kt
class BusinessProfileNotFoundException(...)
class BusinessProfileAlreadySubmittedException(...)
class ApprovedBusinessProfileImmutableException(...)
class BusinessProfilePartialUpdateNotAllowedException(...)

// AuthExceptions.kt
class EmailAlreadyExistsException(...)
class InvalidCredentialsException(...)
class PasswordEncodingException(...)

// ThreadExceptions.kt 에 추가
class MessageContentRequiredException(...)
```

공통 부모 (`sealed class DomainException`) 는 **일부러 도입하지 않음** — 기존 thread/quote 가 평평한 구조였고 handler 매핑이 exception 별이라 부모가 불필요. 추후 공통 로깅/메타데이터 요구가 생기면 sealed hierarchy 로 승격.

### 변경 B: `GlobalApiExceptionHandler` 에 17 개 매핑

| Exception | HTTP | Code | §5.1 의미 |
|---|---|---|---|
| RequestNotFoundException | 404 | 4041 | Resource not found |
| RequestAccessForbiddenException | 403 | 4035 | Not owner or wrong state |
| RequestStateTransitionException | 403 | 4035 | 동일 (owner/state 통합) |
| QuoteNotFoundException | 404 | 4041 | Resource not found |
| QuoteOwnerMismatchException | 403 | 4035 | Quote ownership |
| SupplierProfileAlreadyExistsException | 409 | 4092 | Profile exists |
| SupplierProfileNotFoundException | 404 | 4041 | Resource not found |
| ApprovedSupplierProfileImmutableException | 403 | 4033 | Cannot modify approved supplier |
| SupplierProfileStateImmutableException | 422 | 4221 | Invalid field modification |
| BusinessProfileNotFoundException | 404 | 4041 | Resource not found |
| BusinessProfileAlreadySubmittedException | 409 | 4093 | Active submission exists |
| ApprovedBusinessProfileImmutableException | 403 | 4032 | Cannot modify approved profile |
| BusinessProfilePartialUpdateNotAllowedException | 422 | 4223 | Non-patchable field |
| EmailAlreadyExistsException | 409 | 4091 | Duplicate email |
| InvalidCredentialsException | 401 | 4011 | Invalid credentials |
| PasswordEncodingException | 500 | 5001 | Internal server error |
| MessageContentRequiredException | 400 | 4004 | Empty message |

handler 예시:
```kotlin
@ExceptionHandler(RequestNotFoundException::class)
fun handleRequestNotFound(e: RequestNotFoundException) =
    ResponseEntity.status(HttpStatus.NOT_FOUND).body(
        ApiErrorResponse(code = 4041, message = e.message ?: "Request not found")
    )

@ExceptionHandler(RequestStateTransitionException::class)
fun handleRequestStateTransition(e: RequestStateTransitionException) =
    ResponseEntity.status(HttpStatus.FORBIDDEN).body(
        ApiErrorResponse(code = 4035, message = e.message ?: "Invalid request state")
    )
```

### 변경 C: command service `throw` 교체 (Before/After 예시)

**`RequestCommandService.kt`**

Before:
```kotlin
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException
...
return requestRepository.findById(requestId)
    .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found")))
    .flatMap { request ->
        if (request.requesterUserId != requesterUserId) {
            return@flatMap Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Not the request owner"))
        }
        if (request.state != "draft") {
            return@flatMap Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Only draft requests can be published"))
        }
        ...
    }
```

After:
```kotlin
import dev.riss.fsm.shared.error.RequestAccessForbiddenException
import dev.riss.fsm.shared.error.RequestNotFoundException
import dev.riss.fsm.shared.error.RequestStateTransitionException
...
return requestRepository.findById(requestId)
    .switchIfEmpty(Mono.error(RequestNotFoundException()))
    .flatMap { request ->
        if (request.requesterUserId != requesterUserId) {
            return@flatMap Mono.error(RequestAccessForbiddenException())
        }
        if (request.state != "draft") {
            return@flatMap Mono.error(
                RequestStateTransitionException("Only draft requests can be published")
            )
        }
        ...
    }
```

나머지 5개 서비스도 동일 패턴. `HttpStatus` / `ResponseStatusException` import 전부 제거.

### 변경 D: 테스트 assertion 교체

Before (예: `QuoteCommandServiceTest`):
```kotlin
.expectErrorSatisfies { error ->
    assertTrue(error is ResponseStatusException)
    assertEquals(HttpStatus.FORBIDDEN, (error as ResponseStatusException).statusCode)
}
```

After:
```kotlin
.expectErrorSatisfies { error ->
    assertTrue(error is QuoteOwnerMismatchException)
}
```

대상 테스트 파일:
- `command-domain-quote/QuoteCommandServiceTest` — update-not-owner / select-non-owner
- `command-domain-supplier/SupplierProfileCommandServiceTest` — approvedProfileCannotBeUpdated
- `command-domain-thread/ThreadCommandServiceTest` — sendMessage-empty-payload
- `command-domain-user/AuthCommandServiceTest` — register-duplicate / authenticate-invalid-password
- `command-domain-user/RequesterBusinessProfileCommandServiceTest` — update-approved
- `api-server/request/RequestCommandServiceTest` — publish-non-draft / close-non-open / cancel-closed / non-owner-cannot-update

HTTP status 비교 코드는 삭제. HTTP 관심사는 `GlobalApiExceptionHandler` 단위 테스트 몫.

### 의도적으로 *안* 건드린 범위

- **Application layer 의 `ResponseStatusException`**: `RequestAccessGuard`, `PublicNoticeApplicationService`, `NoticeApplicationService` 등 `api-server` / `admin-server` 내부 application layer 는 그대로. 이 레이어는 HTTP 경계에 가까워 `ResponseStatusException` 이 허용 범위. 일관성 원하면 별도 커밋 라운드.
- **Handler 의 `status × 10` fallback**: 기존 fallback 룰 유지. 매핑되지 않은 `ResponseStatusException` 은 여전히 `code = HTTP status × 10` (§3 문서화) 으로 응답.

### 검증

- `./gradlew test` (전 모듈) **BUILD SUCCESSFUL**
- 공인 IP E2E smoke:
  - 읽기 4/4 ✓, 3역할 인증 3/3 ✓
  - `POST /api/auth/login { password: wrong }` → `http 401, code 4011, message "Invalid credentials"` ← `InvalidCredentialsException` 실전 매핑 확인
  - `POST /api/requests/{closed}/publish` → `http 403, code 4035, message "Only draft requests can be published"` ← `RequestStateTransitionException` 실전 매핑 확인
  - admin 공지 lifecycle `create → publish → archive` 전부 `code 100`

### 이 리팩토링이 열어주는 것

- **순수 단위 테스트 가능**: 도메인 서비스가 Spring WebFlux 타입을 몰라도 됨 → §10 ("command-domain-* 단위 테스트 추가") 가 실제로 가능해짐.
- **의미 중심의 에러 계약**: API 클라이언트가 "403" 외에 code / 구체 exception message 로 처리 가능.
- **일관성**: 여러 도메인에 걸친 "소유자 아님 / 상태 전이 실패 / 찾을 수 없음" 이 동일한 code 로 응답.

---

## 공통 원칙 되짚기

1. **SSOT**: StorageProperties(설정), noticeAttachmentDownloadUrl(URL).
2. **경계 유지**: 도메인은 spring-data 이상의 프레임워크 의존성 피함. 이번엔 `@ConfigurationProperties` 를 shared-core 에 두고 각 앱에서 `@EnableConfigurationProperties` 등록.
3. **Kotlin 관용**: `val` 우선, `!!` 지양, 체이닝/early-return.
4. **DB-side 우선**: 집계·필터는 가능하면 Mongo/SQL 에서.
5. **문서와 코드 동기화**: 암묵적 규약도 글로.
6. **누적 부채는 마주친 순간 청소**: Boy Scout Rule. 단 커밋 메시지에 명시해 리뷰어가 스코프를 오해하지 않게.

---

## 남은 과제 (백엔드 리팩토링)

- ~~**#1**: `command-domain-*` 서비스의 `ResponseStatusException` 을 도메인 sealed exception 으로 교체~~ — `6b536a5` 로 해결됨.
- **Application layer 의 `ResponseStatusException` 일관화** (선택): `RequestAccessGuard`, `PublicNoticeApplicationService`, `NoticeApplicationService` 등도 도메인 exception 으로 묶을지 판단.
- **#10**: `command-domain-*` 각 모듈에 순수 unit test 추가 (현재는 application layer 에 편중). 규모 L.
- **listApproved aggregation 이관**: 데이터 증가 관찰 후 착수.
