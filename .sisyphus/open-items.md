# Open Items (미결사항 / Follow-ups)

> 리팩토링·기능 작업 중 **지금 당장 건드리지 않기로 결정한 후속 과제** 를 모으는 살아있는 문서. 새 항목이 생기면 추가, 해결되면 제거 또는 "해결됨" 표시.
>
> 각 항목 최소 형식:
> - **배경 / 왜 지금 안 하는가**
> - **규모 힌트** (S/M/L)
> - **언제 다시 검토할지 또는 트리거 조건**
> - **참고 파일/커밋**

---

## 백엔드

### BE-1. Application layer 의 `ResponseStatusException` 일관화

- **배경**: `6b536a5` 로 `command-domain-*` 의 `ResponseStatusException` 은 전부 도메인 sealed exception 으로 교체됨. 그러나 `api-server` / `admin-server` 의 **application layer** 파일들은 아직 `ResponseStatusException` 사용 중. 대표:
  - `api-server/.../request/RequestAccessGuard.kt` — 8곳
  - `api-server/.../notice/PublicNoticeApplicationService.kt` — 5곳
  - `admin-server/.../notice/NoticeApplicationService.kt` — 수 곳
  - `api-server/.../supplier/LocalFileStorageService.kt` — 2곳
- **왜 지금 안 하는가**: Application layer 는 HTTP 경계에 가까워 `ResponseStatusException` 사용이 **지침서 §3.4 위반이 아님**. 기능·보안에 문제 없음. 변경 시 장점은 "에러 code 일관성·로깅 통일" 이지만 비용 (파일 다수 + 테스트 다수 수정) 이 큼.
- **규모**: M
- **다시 검토 트리거**:
  - 프론트·외부 API 소비자가 "도메인 code 기반 에러 분기" 를 실제로 쓰기 시작할 때
  - 또는 application layer 에서 흘러나오는 에러 로깅이 도메인 exception 과 구분되지 않아 분석이 어려워질 때
- **참고**: `docs/backend-refactor-2026-04-19.md` §6 "의도적으로 안 건드린 범위"

---

### BE-2. `SupplierQueryService.listApproved` Mongo aggregation 이관

- **배경**: `3c4edc5` 에서 `categories()` / `regions()` 는 Mongo `@Aggregation` pipeline 으로 DB-side 집계. 그러나 `listApproved()` 는 여전히 `findAll().collectList()` 후 메모리 필터 + pagination.
- **왜 지금 안 하는가**: 필터 조합이 복잡 (keyword / category / region / oem / odm / capacity(문자열 내 숫자 추출) / moq). aggregation pipeline 으로 옮기려면 stage 6~7개 필요 + MongoDB 텍스트 인덱스 고려 필요. **현재 seed 데이터는 supplier 8건** 수준이라 메모리 처리의 실제 비용이 없음.
- **규모**: M (데이터 특성 파악·인덱스 설계 포함 시 L)
- **다시 검토 트리거**:
  - `supplier_search_view` 문서 수 1000건 이상
  - 또는 `/api/suppliers` 응답 p95 > 300ms
  - 또는 heap/GC 튐이 확인될 때
- **참고**: `backend/query-model-supplier/src/main/kotlin/dev/riss/fsm/query/supplier/SupplierQueryService.kt:45` (listApproved)

---

### BE-3. Domain unit test 커버리지 확장

- **배경**: `65cc79f` 로 `command-domain-request`, `command-domain-notice` 에 테스트 자리가 생겼고, `quote/supplier/thread/user` 는 이미 존재. 다만 각 모듈의 happy-path 중심 커버리지이며 edge case (복잡한 상태 전이 / concurrency / 잘못된 데이터 조합) 는 부족.
- **왜 지금 안 하는가**: 지침서 "커버리지 %" 목표보다 "business rule 문서화" 우선. 현 수준으로 regression 탐지 충분. edge case 는 실제 버그 발견 시 회귀 테스트로 추가하는 게 경제적.
- **규모**: S~M (feature 단위로 쪼개서 진행)
- **다시 검토 트리거**:
  - 도메인 버그가 production 에서 발견될 때마다 해당 테스트 추가 (Boy Scout)
  - Phase 3 이상에서 공식 coverage 게이트 도입 논의
- **참고**: `docs/backend-refactor-2026-04-19.md` §7

---

## 프론트엔드

### FE-1. `AsyncBoundary` admin-site 확장

- **배경**: `0faaa1c` 로 main-site 에 `AsyncBoundary` 컴포넌트 도입. 현재 `RequestDetailPage`, `RequestListPage` 두 페이지에만 적용. admin-site 는 아직 미적용.
- **왜 지금 안 하는가**: 패턴 정립은 되어 있고 admin-site 페이지들에서 문제 되는 수준의 반복 아님. 양 앱 통일성은 좋으나 필수 아님. 지금은 성과/부담 비율이 낮음.
- **규모**: M (admin-site 각 페이지 마이그레이션 + `packages/ui` 로 승격 고려)
- **다시 검토 트리거**:
  - admin-site 에 새 페이지가 3개 이상 추가될 때 (반복 로딩/에러 처리가 쌓이면)
  - 또는 `packages/ui` 가 React 컴포넌트를 포함하도록 승격 결정될 때
- **참고**: `frontend/apps/main-site/src/shared/components/AsyncBoundary.tsx`, 지침서 §2.5.2

---

### FE-2. 남은 페이지들의 `AsyncBoundary` 적용 (Boy Scout)

- **배경**: main-site 에서도 `ThreadListPage`, `ThreadDetailPage`, `SupplierQuoteListPage`, `SupplierRequestFeedPage`, `NoticeListPage`, `SupplierSearchPage`, `QuoteComparisonPage` 등이 여전히 `if (isLoading) ... if (error) ...` 조기 반환 패턴을 씀.
- **왜 지금 안 하는가**: 기능 문제 없음. 전체 일괄 마이그레이션은 비용 큼. 지침서 §7 "기존 코드는 건드릴 때만 개선" 원칙에 따라 해당 페이지 기능을 터치할 때 같이 정리하는 게 경제적.
- **규모**: 각 페이지당 S, 전체 M~L
- **다시 검토 트리거**: 각 페이지에서 의미 있는 기능 변경이 있을 때 touch-ups 포함

---

### FE-3. `packages/ui` 승격

- **배경**: main-site/admin-site 공유 가치가 있는 컴포넌트 (`AsyncBoundary`, 페이지 layout helper 등) 가 main-site 내부 (`shared/components/`) 에만 존재. `packages/ui` 는 현재 shared CSS 만 제공.
- **왜 지금 안 하는가**: React 를 `packages/ui` peer dependency 로 추가·관리해야 함. 현재 프로젝트 규모에선 공유 필요성이 강하지 않음.
- **규모**: S (인프라) + M (마이그레이션)
- **다시 검토 트리거**: 공유 컴포넌트 수 5개 이상, 또는 admin-site 에 동일 패턴이 여러 번 반복될 때

---

## 인프라 / 운영

### OP-1. Mongo seed 재시드 가이드 운영 문서화 ✅ 해결됨 (2026-04-19, `b92dc79`)

- `LOCAL-RUN-GUIDE.ko.md §6` 에 재시드 규약, Colima 변형, 체크포인트 기록
- `docs/REFACTORING-GUIDELINES.ko.md §8 case 3` 에 사례 기록 (증상/원인/조치/교훈 3)
- 지침서 버전 1.6 으로 bump

---

### OP-2. CI 강화

- **배경**: `.github/workflows/backend-ci.yml`, `frontend-ci.yml` 은 Phase 2 Task 01 에서 추가. 현재 단계는 build + test + type-check 중심.
- **왜 지금 안 하는가**: 최소 baseline 이 안착되었고 로컬에서 `./gradlew test`, `yarn type-check`, vitest, e2e 가 전부 green. CI 레벨 추가 검증은 규모 작지만 PR 정책과 연동되어야 의미가 큼.
- **규모**: S~M
- **추가 후보**:
  - ~~type-check (`yarn workspace @fsm/main-site type-check`) 를 CI 에 포함~~ ✅ 이미 `frontend-ci.yml` 에 `yarn type-check` (전 워크스페이스 topological) 포함. Task 01 단계에서 반영되어 있음. 재확인 2026-04-19.
  - `grep` 으로 리터럴 queryKey / `as any` / 하드코딩 URL 감지하는 lint step
  - `yarn e2e` 를 nightly 또는 PR 라벨 기반으로 실행
- **다시 검토 트리거**: PR 프로세스 정착 이후, 또는 외부 협업자가 들어올 때
- **참고**: `.github/workflows/*.yml`

---

### OP-4. 관리자 감사 검색 API

- **배경**: Phase 2 Task 03 원래 SubTask 3.5 (`GET /api/admin/audit-logs?actor=&action=&target=&since=&until=`). 2026-04-19 재평가에서 "검수 상세 화면에 타임라인 렌더링" 이 실운영 가치 대부분을 커버한다고 판단해 축소·분리.
- **왜 지금 안 하는가**: 실제 감사 요청이 들어오기 전까지는 `AuditLogRepository` 에 직접 SQL 로 조회하는 편이 비용이 더 낮음. 엔드포인트 스펙 (필터 조합, 페이지네이션, 접근 제어) 은 운영 요구가 형성된 후 결정하는 편이 정확함.
- **규모**: S~M
- **다시 검토 트리거**:
  - 관리자가 과거 결정 이력을 cross-target 으로 조회할 필요가 실제로 발생할 때
  - 규제/감사 요구 (법적 근거, 보존 기간 관련) 가 구체화될 때
- **참고**: `.sisyphus/plans/phase2-subplans-reassessment-2026-04-19.md` §"Task 03 이관 제안"

---

### OP-3. GitHub branch protection

- **배경**: Phase 2 Task 01 마무리 당시 API 403 — private repo + 무료 플랜에선 branch protection 지원 안 됨.
- **왜 지금 안 하는가**: GitHub Pro 업그레이드 또는 repo public 전환 전에는 불가. 사용자 판단.
- **규모**: S (설정만)
- **다시 검토 트리거**: GitHub Pro 결제 또는 repo 공개 결정

---

## Phase 2 로드맵 재평가

### PH-1. Phase 2 Task 02~07 재평가

- **배경**: Phase 2 subplan 7개 (`.sisyphus/plans/phase2-subplans/phase2-task-{01..07}-*.md`) 중 Task 01 완료. Task 02 (Router future-flag + frontend README) 는 프론트 리팩토링 과정에서 일부 흡수 (React Router warning 은 아직 남아 있을 가능성, README 정리는 미완).
- **왜 지금 안 하는가**: Phase 2 전체 로드맵을 지금 다시 훑어서 "리팩토링 사이클 이후 남은 것" 을 재정리할 필요. 지금 당장 블로킹 아님.
- **규모**: S (재평가) + 각 task 별 M~L
- **다시 검토 트리거**: 리팩토링 작업 안정화 후 (= 지금 시점 이후 첫 세션), 또는 사용자가 기능 개발 방향으로 돌아갈 때
- **할 일**:
  - Task 02 실제 상태 확인 (`yarn dev` 콘솔에 Router warning 남아 있는지)
  - Task 03~07 각각의 현재 타당성 재평가
  - subplans index 갱신
- **참고**: `.sisyphus/plans/phase2-execution-plan.ko.md`, `.sisyphus/plans/phase2-subplans-index.ko.md`

---

## 지침서 개선

### DOC-1. `docs/REFACTORING-GUIDELINES.ko.md` §8 사례 누적

- **배경**: 지침서 v1.5 의 §8 에는 2사례 기록됨 (Vite proxy 전환, CORS allowedOriginPatterns). 이후 세션에서 진행한 다른 리팩토링 (queryKey factory, 페이지 분해, i18n, AsyncBoundary, @Transactional 위치, domain exception) 은 별도 세션 핸드오프 + backend-refactor 문서에만 기록되어 있음.
- **왜 지금 안 하는가**: 사례가 너무 많아 `docs/REFACTORING-GUIDELINES.ko.md` 가 과비대해질 위험. 대신 짧은 요약 + 링크 방식이 맞을 수도.
- **규모**: S
- **다시 검토 트리거**: 다음 대규모 리팩토링 후 §8 구조 정리 필요할 때

---

## 변경 이력

| 날짜 | 변경 |
|------|------|
| 2026-04-19 | 초판. 백엔드 리팩토링 세션 직후 미결사항 정리. |
| 2026-04-19 | OP-1 해결 (b92dc79). |
| 2026-04-19 | OP-2 type-check 항목은 Task 01 시점부터 이미 CI 에 포함됨을 확인 (022c887 이후). |
| 2026-04-19 | Phase 2 Task 03~07 재평가: 03 축소, 04/05 진행, 06/07 이관. OP-4 (audit 검색 API) 신규. |
