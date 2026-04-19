# Session Handoff — 2026-04-19

> 2026-04-17 핸드오프 이후 진행된 프론트 리팩토링 대장정 → 백엔드 리팩토링 사이클 → 미결 항목 정리까지 총 23 커밋.
> 이전 세션 기록: `.sisyphus/session-handoff-2026-04-17.md`
> 미결 항목 (다음 세션 이후 후보): `.sisyphus/open-items.md`
> 백엔드 리팩토링 상세 노트: `docs/backend-refactor-2026-04-19.md`

---

## 0. 30초 요약

이번 세션 핵심 5줄:

1. **인프라/환경** — Vite dev server 를 **same-origin proxy** 방식으로 바꾸고, backend CORS 를 `allowedOriginPatterns` 로 전환해 공인 IP 외부 접속 시에도 하드코딩 0 으로 동작. 공유기 UPnP 로 5173/5174 매핑.
2. **리팩토링 지침서** `docs/REFACTORING-GUIDELINES.ko.md` **v1.5** 로 정착. 공통 원칙 + FE/BE 가이드 + PR 체크리스트 + §8 사례 2건.
3. **프론트엔드 리팩토링 9커밋** — queryKey factory, 500+줄 페이지 분해, 인라인 스타일 → utility class, i18next 전면 도입, fixture 복원, polish, hook 테스트, AsyncBoundary, as-any 제거.
4. **백엔드 리팩토링 7커밋** — `StorageProperties` 외부화 + 누적 test drift 청소, `var`/`!!`/URL 하드코딩 정리, Mongo aggregation 이관, `@Transactional` 위치 교정, command-domain 28곳의 `ResponseStatusException` → 도메인 sealed exception, command-domain-* unit test 자리 확립. 모든 상세는 `docs/backend-refactor-2026-04-19.md`.
5. **E2E 검증** Playwright 45/45 + vitest 105+15 + `./gradlew test` 전 모듈 SUCCESSFUL + 공인 IP × 3역할 read/write 전부 green. 백엔드 Mongo seed 누락 이슈 1건 발견 후 즉시 복구.

**다음 액션**: `.sisyphus/open-items.md` 에 10 항목 정리. 우선 후보는 Phase 2 Task 02~07 착수, 또는 OP-1 Mongo 재시드 운영 가이드, OP-2 CI 강화.

사용자 발화 마지막 시점: 리팩토링 사이클 매듭 + 미결사항 문서화 완료. 새 세션은 기능 작업 (Phase 2 Task 03~07) 으로 복귀 가능.

---

## 1. 세션 타임라인

2026-04-17 이후 발생한 것들을 시간순으로:

1. (04-17→04-18 연장) 지난 세션 handoff 받아 `git pull` → `api-spec.md` 충돌 발견 → 원격 우선 (integer 타입 유지) + 내 신규 endpoint 7개만 이식 후 Phase 2 Task 01 5커밋으로 쪼개 push.
2. Backend CORS / Vite proxy 전환 작업으로 **하드코딩 4곳 → 0곳**. 공인 IP 외부 접속 성공.
3. 리팩토링 지침서 최초 작성 (v1.0) + Vite proxy, CORS allowedOriginPatterns 2사례 §8 에 기록.
4. 프론트 전수 리팩토링 분석 → 권장 순서 (#2 쿼리키 → #4 페이지 → #3 스타일 → #1 i18n → #5/#7/#8 polish → #10 테스트 → #11 AsyncBoundary) 대로 전부 실행.
5. E2E + 리뷰 실행. 백엔드 Mongo seed 누락 발견 → 복구.
6. 백엔드 리팩토링 사이클 (지침서 §3 기반, 원래 권장안 재정렬 후 bottom-up):
   - `StorageProperties` @ConfigurationProperties + 누적 test drift 청소 (`./gradlew test` 최초로 전 모듈 green)
   - polish: `var` 제거, `!!` 제거, URL 하드코딩을 private helper 로
   - `api-spec.md §2.5` 에 에러 code fallback 규약 (`status × 10`) 명시
   - `SupplierQueryService.categories/regions` 를 Mongo `@Aggregation` pipeline 으로
   - `@Transactional` 을 domain (NoticeCommandService) → application layer 로 이동
   - command-domain 6개 서비스 28곳의 `ResponseStatusException` → 17개 도메인 sealed exception + `GlobalApiExceptionHandler` 매핑 추가
   - `RequestCommandServiceTest` 를 api-server → command-domain-request 로 이동 + `NoticeCommandServiceTest` 신규
   - 상세 문서 `docs/backend-refactor-2026-04-19.md` 에 §1~§7 기록
7. 미결 항목 10개 `.sisyphus/open-items.md` 로 정리 (backend 3 / frontend 3 / 운영 3 / 로드맵 1).

---

## 2. 누적 커밋 (origin/main, 본 세션 범위)

이전 세션 마지막: `b5e4cca docs(phase2): record task 01 evidence + handoff`

이후 추가된 커밋 (시간순):

**프론트 리팩토링 사이클**
```
e0c16b2  refactor(fe): introduce Vite proxy for same-origin API calls
d9e8132  refactor(be): switch CORS to allowedOriginPatterns, drop yml list
d07d2d0  docs(refactor): add refactoring guidelines with applied cases
df682b8  refactor(fe): centralize TanStack Query keys in per-feature factories
04d4158  refactor(fe): split oversized pages into focused components
0b71239  refactor(fe): replace inline styles with shared.css utility classes
4b022c5  refactor(fe): introduce i18next with per-feature namespaces
38f77c6  fix(fe): restore optional chains and align test fixtures for string typing
dfbcc98  refactor(fe): polish — aria-label, tighter invalidation, comment cleanup
4546c44  test(fe): add hook unit tests for supplier-profile and discovery
0faaa1c  refactor(fe): introduce AsyncBoundary for loading/error/empty states
3c31eaa  refactor(fe): drop as-any and tighten useWithdrawQuote signature
```

**중간 handoff 스냅샷**
```
392c094  docs(phase2): session handoff for 2026-04-19  (이 파일의 v1.0)
```

**백엔드 리팩토링 사이클**
```
8ec62ab  refactor(be): externalize storage config and fix accumulated test drift
b86294d  refactor(be): polish — drop var, remove !!, extract URL builder
676566c  docs(api): document error code convention and HTTP-status fallback
3c4edc5  perf(be): move category/region counts to Mongo aggregation
634f3a7  docs: backend refactor notes for 2026-04-19 session
09b4e46  refactor(be): move @Transactional from domain to application layer
1601a49  docs(be): add §5 @Transactional relocation notes to refactor doc
6b536a5  refactor(be): replace ResponseStatusException with domain exceptions in command domains
de78901  docs(be): add §6 domain exception relocation notes to refactor doc
65cc79f  test(be): establish command-domain unit test seats for request and notice
133a93d  docs: track open follow-ups in .sisyphus/open-items.md
```

**총 23개 커밋** (프론트 12 + handoff 1 + 백엔드 10 + open-items 1). 본 파일 최신판은 별도 커밋.

---

## 3. 지침서 변경 이력 (`docs/REFACTORING-GUIDELINES.ko.md`)

| 버전 | 변경 |
|---|---|
| 1.0 | 초판. Phase 2 진입 시점 원칙 정리 |
| 1.1 | §8 사례 2: CORS `allowedOriginPatterns` 전환 |
| 1.2 | §2.5.1 Query Key Factory 규약 추가 |
| 1.3 | §2.6 강화: 정적 style 값은 utility class 우선 |
| 1.4 | §2.9 강화: i18n useTranslation + namespace 규약 |
| 1.5 | §2.5.2 AsyncBoundary 패턴 추가 |

---

## 4. 품질 지표 (세션 종료 시점)

| 항목 | 값 |
|---|---|
| FE type-check main-site | **0** (이전 세션 시작 시 40) |
| FE type-check admin-site | **0** (이전 세션 시작 시 5) |
| vitest main-site | **105/105** (기존 92 + 신규 13) |
| vitest admin-site | **15/15** |
| Playwright e2e | **45/45** |
| BE `./gradlew test` 전 모듈 | **BUILD SUCCESSFUL** (이번 세션 전엔 한 번도 통과 못 하던 상태) |
| 공인 IP 읽기 smoke | **21/21** |
| 권한 가드 | **6/6** |
| 리터럴 queryKey (production FE) | **0** |
| 사용자 가시 한국어 인라인 (FE) | **0** (주석 제외) |
| production `as any` (FE) | **0** |
| 하드코딩 URL/IP/CORS origin | **0** |
| command-domain `ResponseStatusException` | **0곳** (이전 28곳) |
| command-domain `@Transactional` 잘못된 위치 | **0곳** (이전 Notice 에 5곳) |

---

## 5. 아키텍처/패턴 요약

### 5.1 프론트엔드 (변경 후)

- **Vite proxy**: `vite.config.ts` 2개에 `server.proxy: { '/api': http://localhost:8080/8081, changeOrigin: true }`. 브라우저 상대 경로 호출 → same-origin → CORS 불필요.
- **Backend CORS**: `ApiSecurityConfig.kt`, `AdminSecurityConfig.kt` 에서 `allowedOriginPatterns` + 기본값 `http://*:5173,http://*:5174`. yml 의 `fsm.cors.*` 섹션 삭제됨.
- **Query Key Factory**: 13 feature 각각 `query-keys.ts` — `{ all, lists, list(p), details, detail(id) }` 구조.
- **i18n**: `src/i18n/index.ts` + `src/i18n/locales/ko/<namespace>.json` × 12(main) / 7(admin). `useTranslation("<ns>")` + `t("common:...")` prefix.
- **AsyncBoundary**: `apps/main-site/src/shared/components/AsyncBoundary.tsx` — loading/error/empty/success 4상태 render-function 방식. 2 페이지 적용 (RequestDetailPage, RequestListPage). admin-site 미적용.
- **테스트 setup**: `src/test/setup.ts` 에 `import "../i18n"` 추가 (양 앱).

### 5.2 백엔드 (이번 세션 변경분)

- **CORS**: `ApiSecurityConfig.kt`, `AdminSecurityConfig.kt` — `allowedOrigins` → `allowedOriginPatterns`. 기본값 `http://*:5173,http://*:5174`. yml 의 `fsm.cors.*` 섹션 전체 삭제.
- **설정 외부화**: `shared-core/.../StorageProperties.kt` (`@ConfigurationProperties("fsm.storage")`). `LocalFileStorageService` + `NoticeApplicationService` 의 `@Value` 단건 주입 제거 → `StorageProperties` 생성자 주입. 각 Application 에 `@EnableConfigurationProperties(..., StorageProperties::class)`.
- **Query 최적화**: `SupplierSearchViewRepository` 에 `@Aggregation` pipeline 2개 (`aggregateCategoryCounts`, `aggregateRegionCounts`) + projection DTO. `SupplierQueryService.categories/regions` 는 DB-side 집계로.
- **Transactional**: `NoticeCommandService` 의 5 `@Transactional` 제거 → `NoticeApplicationService` 의 쓰기 유즈케이스 (create/update/uploadAttachment/deleteAttachment) 에 부여. 도메인은 Spring 의존성에서 해방.
- **Exception 경계**: `shared-core/error/` 에 17 개 도메인 exception 추가 (Request 3 / QuoteOwnership 2 / SupplierProfile 4 / BusinessProfile 4 / Auth 3 / Message 1). `GlobalApiExceptionHandler` 에 매핑 추가. 6 command-domain 서비스 전수 교체. 테스트 assertion 도 `is <DomainException>` 으로 전환.
- **Kotlin polish**: `NoticeApplicationService` 의 `var filtered` → filter 체인 / `SupplierQueryService` 의 `!!` → `?: return@filter true` / admin notice attachment URL → `private fun noticeAttachmentDownloadUrl(...)` helper.
- **도메인 unit test 자리 확립**: `command-domain-request` 에 `RequestCommandServiceTest` 이동 (원래 api-server 에 있던 것, package + unused import 정리) + build.gradle 에 `kotlin.spring` + `reactor-test` 보강. `command-domain-notice/NoticeCommandServiceTest` 신규 (10 케이스). Spring context 불필요, StepVerifier + mock repository.
- **Admin-server 테스트 인프라 수리**: `src/test/resources/application.yml` 신규 (H2 r2dbc + JWT test secret 32자 + Mongo autoconfigure exclude) + build.gradle 에 `testRuntimeOnly(libs.r2dbc.h2)`. 이번 이전엔 Admin 테스트가 한 번도 돌지 않던 상태.
- **test fixture 누적 drift 청소**: string ↔ integer typing pass 이후 반영 안 됐던 `desiredVolume/monthlyCapacity/moq/unitPriceEstimate/leadTime/sampleCost/targetPriceMin/targetPriceMax` 필드 전부 정리 (sed 일괄).

상세는 `docs/backend-refactor-2026-04-19.md` 참고 (§1~§7 + 공통 원칙 + 남은 과제).

---

## 6. 발견·조치한 이슈

### 6.1 Mongo seed 누락 (조치 완료)

**증상**: `POST /api/requests/{id}/quotes` 호출 시 HTTP 200 응답 바디에 `code: 5000` + `Failed to instantiate RequesterRequestSummaryDocument ... requesterUserId null`.

**근본 원인**: Mongo volume 이 persisted 된 상태에서 seed 스크립트(`02-seed-read-models.js`) 가 과거 버전(requesterUserId/updatedAt 필드 없던 시점)으로 한 번 실행된 후 재실행 안 됨. 스크립트 자체는 이미 idempotent (`_id: /seed_/` deleteMany + re-insert).

**조치**: `./scripts/local/seed-mongodb.sh` 수동 재실행으로 Mongo view 복구. 코드 변경 불필요.

**향후 방지**: 
- `LOCAL-RUN-GUIDE.ko.md` 또는 `docs/TEST-GUIDE.md` 에 "seed 스크립트 변경 후 수동 재시드 필요" 명시 — 아직 반영 안 함.
- 또는 seed 스크립트 버전 체크 + 자동 재적용 로직 — 미설계.
- 지침서 §8 에 사례 3으로 기록할지 후속 판단.

### 6.2 Phase 2 Task 01 branch protection (보류)

**상태**: GitHub 무료 플랜 + private repo 라 API 403. Pro 업그레이드 또는 repo public 전환 시 설정 가능. 사용자 결정 대기.

---

## 7. 현재 인프라 상태 (세션 종료 시)

| 구성 | 상태 | 비고 |
|---|---|---|
| Colima VM | ✅ | macOS Virtualization.Framework |
| MariaDB (13306) | ✅ | `fsm-local-mariadb-mariadb-1`, 컨테이너 |
| MongoDB (27018) | ✅ | `fsm-local-mongodb-mongodb-1`. 이번 세션에서 requester_request_summary_view 재시드 완료 |
| api-server (8080) | ✅ | 백그라운드 Gradle bootRun, 로그 `/tmp/fsm-logs/api-server.log` |
| admin-server (8081) | ✅ | 동일 |
| main-site vite (5173) | ✅ | `yarn workspace @fsm/main-site dev --host 0.0.0.0` |
| admin-site vite (5174) | ✅ | 동일 |

**UPnP 매핑 (공유기 `172.30.1.254`)**

```
 5173 TCP → 172.30.1.42:5173  'fsm-main-site-dev'
 5174 TCP → 172.30.1.42:5174  'fsm-admin-site-dev'
```

(이전에 임시로 뚫었던 `18080→8080`, `8081`은 proxy 전환 후 제거됨. 현재는 프론트 포트만 외부 오픈.)

**공인 IP**: `121.133.86.173` (ISP 할당, 바뀔 수 있음).

**재기동 시**: Playwright `webServer` 가 자체 spawn 하지 않으므로 다음 세션에서 수동 기동 필요 — 핸드오프 §7 참조 `LOCAL-RUN-GUIDE.ko.md` 순서 그대로.

---

## 8. 시드 계정 (변경 없음, 비번 `Test1234!`)

| 역할 | 이메일 |
|---|---|
| ADMIN | `admin@test.com`, `admin2@test.com` |
| REQUESTER | `buyer@test.com`, `buyer2@test.com`~`buyer5@test.com` |
| SUPPLIER | `supplier@test.com`~`supplier8@test.com` |

**Supplier approval 상태 주의**: 일부 supplier 계정은 `verificationState != approved` 라 `/api/supplier/*` 쓰기 호출 시 **403(code=4036)** 로 차단됨. E2E 시 approved supplier (`supplier`, `supplier2`, `supplier3`, `supplier4`) 사용 권장.

---

## 9. 미결 / 후속 작업

**전량 `.sisyphus/open-items.md` 로 이관**. 각 항목 형식: 배경 / 왜 지금 안 하는가 / 규모 / 다시 검토 트리거 / 참고.

현재 10 항목 요약:

- **백엔드**: BE-1 application layer ResponseStatusException 일관화, BE-2 listApproved aggregation 이관, BE-3 domain test 커버리지 확장
- **프론트**: FE-1 AsyncBoundary admin-site 확장, FE-2 남은 페이지 Boy Scout, FE-3 packages/ui 승격
- **운영**: OP-1 Mongo seed 재시드 가이드, OP-2 CI 강화 (type-check/lint/e2e), OP-3 GitHub branch protection
- **로드맵**: PH-1 Phase 2 Task 02~07 재평가
- **지침서**: DOC-1 §8 사례 누적 구조 정리

해결된 High 는 전부 이번 세션에서 처리 (백엔드 리팩토링 #3/#4/#5/#6/#7/#8/#9/#1/#10 완결). 남은 것은 현 시점 필수 아님.

---

## 10. 다음 세션 시작 권장 행동

1. 이 문서 + `docs/REFACTORING-GUIDELINES.ko.md` + 메모리 `MEMORY.md` 로 컨텍스트 복원.
2. `git log --oneline origin/main~15..origin/main` 으로 커밋 히스토리 확인.
3. 인프라 상태 확인:
   ```bash
   lsof -iTCP -sTCP:LISTEN -n -P | grep -E ":(5173|5174|8080|8081|13306|27018)\b"
   colima status
   ```
   내려가 있으면 `LOCAL-RUN-GUIDE.ko.md` 대로 기동.
4. **권장 다음 액션**: 백엔드 리팩토링 (§9 High). 지침서 §3 기반으로 먼저 전수 조사 agent 돌리고 우선순위 설계.

---

## 11. 참고 파일 빠른 링크

- 리팩토링 지침서: `docs/REFACTORING-GUIDELINES.ko.md` (v1.5, 2026-04-19)
- 직전 핸드오프: `.sisyphus/session-handoff-2026-04-17.md`
- Phase 2 plan: `.sisyphus/plans/phase2-execution-plan.ko.md`
- Phase 2 subplans: `.sisyphus/plans/phase2-subplans/`
- API spec: `.sisyphus/drafts/api-spec.md` (v1.5)
- 로컬 실행 가이드: `LOCAL-RUN-GUIDE.ko.md`
- 테스트 가이드: `docs/TEST-GUIDE.md`

---

## 12. Document History

| 버전 | 날짜 | 변경 |
|---|---|---|
| 1.0 | 2026-04-19 | 초판. 2026-04-17 이후 프론트 리팩토링 + E2E 까지 기록. |
| 1.1 | 2026-04-19 | 백엔드 리팩토링 사이클 (7커밋) + open-items 분리 반영. §0/§1/§2/§4/§5.2/§9/§12 갱신. |
