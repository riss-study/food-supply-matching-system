# Phase 2 Task 03~07 재평가 (2026-04-19)

작성 맥락: Task 01 (E2E + CI baseline) / Task 02 (Router + README hygiene) 완료. 그 사이 8~9개의 리팩토링 커밋 (프론트 9 / 백엔드 7) 이 실제 코드를 바꾸면서 원래 subplan 들의 전제를 일부 무력화함. 본 문서는 Task 03~07 **현재 코드 기준 남은 범위**, **권장 우선순위**, **스킵/이관 결정** 을 정리.

검토 대상 파일:

- `.sisyphus/plans/phase2-subplans/phase2-task-03-admin-review-history-and-audit.md`
- `.sisyphus/plans/phase2-subplans/phase2-task-04-supplier-discovery-sort-and-index.md`
- `.sisyphus/plans/phase2-subplans/phase2-task-05-swagger-and-contract-polish.md`
- `.sisyphus/plans/phase2-subplans/phase2-task-06-reviews-and-ratings-foundation.md`
- `.sisyphus/plans/phase2-subplans/phase2-task-07-hot-query-hardening.md`

실제 코드 확인 레퍼런스:

- `backend/command-domain-supplier/.../AuditLogEntity.kt` (table 존재)
- `backend/admin-server/.../review/AdminReviewApplicationService.kt` (audit write + history read)
- `backend/query-model-supplier/.../SupplierQueryService.kt:45` (in-memory filter/sort 잔재)
- `backend/docker/mongodb/init/01-init-read-store.js` (bootstrap marker 만 있음 — index 미정의)

---

## 요약 표

| Task | 원래 규모 | 실 남은 규모 | 권장 | 근거 |
|------|-----------|--------------|------|------|
| 03 Admin Review History & Audit | L (8 SP) | **S~M** | 🟡 축소 후 진행 | backend 레벨에서 audit write/read 이미 구현. 남은 건 UI 타임라인 + 누락 이벤트 점검 + audit 검색 API. |
| 04 Supplier Discovery Sort & Index | L (8 SP) | **M** | 🟢 진행 | API 파라미터는 있으나 전부 in-memory. Mongo 인덱스 미정의. BE-2 open-item 과 정확히 겹침. UI 정렬/필터 위젯 상태 확인 필요. |
| 05 Swagger & Contract Polish | M (5 SP) | **M** | 🟢 진행 | 기존 폴리싱 없음. 저위험·중가치. |
| 06 Reviews & Ratings Foundation | XL (13 SP) | XL (13 SP) | 🔴 보류 | 신규 product slice. 비즈니스 정책 (자격, 모더레이션, 프라이버시) 선결 필요. Phase 2 후반 또는 Phase 3. |
| 07 Hot Query Hardening | L (8 SP) | **측정 먼저** | 🔴 보류 | Data volume (supplier 8건, request 소량) 에서 hot-path 가 아직 없음. 04 후속으로 자연 해소 가능. |

권장 실행 순서: **04 → 05 → 03** (04/05 는 병렬 가능). 06, 07 은 Phase 2 후반 또는 Phase 3 로 이관.

---

## Task 03 — 축소 후 진행

### 이미 돼 있는 것

- `audit_log` 테이블 존재 (`01-schema.sql:163`)
- `AuditLogEntity` + `AuditLogRepository` 존재 (`command-domain-supplier`)
- `AdminReviewApplicationService` 가 review transition 에서 audit 기록 (`save(AuditLogEntity(...))` at line 164)
- 검수 상세 API 가 `findAllByTargetTypeAndTargetIdOrderByCreatedAtDesc` 로 history 조회 (line 62)

### 남은 작업 (축소)

1. **누락 이벤트 감사**: 현재 `verification_submission` 타입만 기록. `notice_publish`, `request_status_change`, `business_verification` 등은 기록 여부 확인 후 누락 시 추가. — S
2. **admin-site UI 타임라인**: 검수 상세 화면에 history 렌더링. 백엔드 계약이 이미 있으므로 FE 중심. — S~M
3. **감사 검색 API** (`GET /api/admin/audit-logs`): 운영 대응용. 필요성은 실제 요청이 올 때까지 **보류 가능**. 지금은 검수 상세 화면이면 충분. — S
4. **테스트/evidence**: 기존 `AdminReviewApplicationService` 테스트 보강. — S

**재정의된 스코프**: 3~5 SP. 원래 8 SP 에서 거의 절반. SubTask 3.5 (audit 검색 API) 는 **별도 open-item 으로 이관** 권장.

### 이관 제안

- `open-items.md` 에 `OP-4. 관리자 감사 검색 API (`/api/admin/audit-logs?actor=&action=&target=&since=`)` 추가 — 운영 요구가 생기면 착수.

---

## Task 04 — 진행 (BE-2 와 통합)

### 이미 돼 있는 것

- `SupplierSearchQuery` 에 sort/order/keyword/category/region/oem/odm/minCapacity/maxMoq 파라미터 정의 (`SupplierQueryService.kt:6-18`)
- `categories()` / `regions()` 는 Mongo aggregation 으로 DB-side 집계 (`3c4edc5`)

### 남은 작업

1. **in-memory filter/sort 제거**: `listApproved` 가 `findAll().collectList()` 후 Kotlin 시퀀스로 filter/sort/paginate (line 49-87). Mongo aggregation pipeline 또는 `ReactiveMongoTemplate` + `Query.addCriteria()` + `Sort` 로 이관. — M
2. **Mongo 인덱스 정의**: `01-init-read-store.js` 에 `supplier_search_view` 인덱스 추가 (`{exposureState:1, updatedAt:-1}`, `{categories:1}`, `{region:1}`, `{companyName: "text"}`). 재시드 규약 (OP-1 에서 문서화됨) 으로 기존 환경 적용. — S
3. **`monthlyCapacity`, `moq` 숫자화 문제**: 현재 필드가 자유 텍스트 (SupplierQueryService.kt 의 `.filter { it.isDigit() }.toIntOrNull()` 참조). DB-side 필터링을 하려면 **write 시점에 정규화된 숫자 컬럼** (`monthlyCapacityNumeric`, `moqNumeric`) 을 추가하거나, 필터 정책을 바꿔야 함. 정책 결정 필요. — S (결정) + S~M (실행)
4. **UI 정렬/필터 위젯**: main-site `/suppliers` 페이지 현재 상태 확인 후 (없으면) 드롭다운 + 필터 패널 추가 + URL query sync. — M
5. **회귀 테스트**: 정렬/필터 조합 backend test, UI hook test. — S

**재정의된 스코프**: 5~8 SP. 원래 8 SP 유지.

### BE-2 와의 관계

`open-items.md` BE-2 ("`listApproved` Mongo aggregation 이관") 는 본 Task 04 의 SubTask 1·2 와 정확히 동일한 작업. Task 04 착수 시 BE-2 자동 해결. 중복 기록 상태이므로 착수 시 BE-2 는 resolved 처리.

---

## Task 05 — 진행

### 남은 작업

계획 그대로 유효. 지금 착수해도 블로커 없음. 기능 변경이 없어 Task 03/04 와 병렬 가능. 대표 값은:

- 공개 `/api/notices`, `/api/suppliers`, `/api/suppliers/{id}` 응답 예제
- 에러 envelope 표준 예제 (`code/message/errors/traceId`) — `6b536a5` 에서 도입한 domain exception code 를 예제에 반영하면 문서 일관성 개선
- `@SecurityRequirement(bearerAuth)` 일괄 부착
- OpenAPI snapshot test 는 SubTask 5.6 대로 **선택 항목**

**재정의된 스코프**: 4~5 SP. 원래 5 SP 유지.

---

## Task 06 — Phase 2 후반 또는 Phase 3 이관

### 왜 지금 아닌가

- **비즈니스 정책 선결 필요**: 자격 (어떤 상태에서 작성 가능한지), 1:1 제약, 모더레이션 (금칙어 리스트), 프라이버시 (회사명 마스킹) — PRD 수준 합의 없이 착수하면 정책 재작업 비용이 큼.
- **신규 도메인 (command/read/projection)**: 새 모듈 추가, Mongo view 필드 확장, projection consumer 추가. 13 SP 의 무게가 실제로 큼.
- **현재 데이터 볼륨에서 임팩트가 불명확**: supplier 8건, 완료된 request/quote 거의 없음. 리뷰 작성 플로우를 테스트할 실사례가 적어 검증 품질이 떨어짐.

### 트리거

- `/api/requests` 의 `closed` 상태 진입이 실사용에서 관측될 때
- 비즈니스 (PO) 가 trust 레이어 도입을 공식 우선순위로 올릴 때
- 공급자/구매자 양쪽에서 "리뷰 기능" 을 명시 요구할 때

### 임시 대체

지금은 `AdminReviewApplicationService` 의 내부 검수 결과가 공급자 exposureState (`approved/hold/rejected`) 로 공개 신뢰 신호 역할을 이미 수행. 추가 리뷰 레이어 없이도 UX 최소 보장.

---

## Task 07 — 측정 선행, 지금은 보류

### 왜 지금 아닌가

- **측정 전 최적화 금지** (본 subplan §"리스크" 에도 "측정 없이 최적화" 가 High 리스크로 기록됨)
- **현 데이터 볼륨**: supplier 8건, request 수십건, quote 수십건. Mongo `findAll().collectList()` 의 비용이 ms 단위. hot-path 가 아님.
- **Task 04 착수 시 자연 해소**: SubTask 7.3 (supplier 탐색 잔재 정리) 는 Task 04 에 통합됨. 7.4 (의뢰/견적 목록) 만 남는데, 이 역시 관측된 느린 쿼리가 없는 상태.

### 트리거

- 실운영 로그에서 특정 endpoint p95 > 500ms
- JMeter/k6 등으로 1k~10k row seed 후 재측정하여 임계 초과
- admin stats 가 분 단위 timeout 을 유발할 때

---

## 실행 제안

### 다음 세션 (순차 또는 병렬)

1. **Task 05** (Swagger polish) — 저위험 / 중가치. 1-2일.
2. **Task 04** (Supplier discovery) — BE-2 통합. 2-3일.
3. **Task 03** (Admin review history) — 축소된 FE 중심 작업. 1-2일.

### 이후 세션

- **Task 06** (Reviews) — 비즈니스 정책 결정 후
- **Task 07** (Hot query) — 데이터 볼륨 또는 측정 결과 기반

### subplans-index 갱신 필요 항목

- Task 03 상태: Not Started → **Reduced Scope**
- Task 04 상태: Not Started → **Ready (BE-2 흡수)**
- Task 05 상태: Not Started → **Ready**
- Task 06 상태: Not Started → **Deferred (policy-blocked)**
- Task 07 상태: Not Started → **Deferred (measurement-blocked)**

---

## 결론 (한 줄)

원래 Task 03~07 의 합산 42 SP → 실 남은 범위 **약 15~18 SP** (Task 03 축소 + 04 유지 + 05 유지 + 06·07 이관). 04/05 를 먼저 병렬로, 03 은 FE 중심으로 축소. 06/07 은 트리거 조건이 충족될 때까지 보류.
