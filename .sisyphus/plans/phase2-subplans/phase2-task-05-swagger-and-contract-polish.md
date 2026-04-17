# Phase 2 Task 05 - Swagger 및 계약 정리

## 메인 Task 메타데이터

| 항목 | 값 |
|------|-----|
| **메인 Task ID** | P2-05 |
| **Wave** | 2 (MVP Completion Debt Closure) |
| **우선순위** | P1 |
| **기간** | 1.5-2일 |
| **스토리 포인트** | 5 |
| **작업자** | Backend |
| **상태** | 🔴 Not Started |
| **Can Parallel** | YES (P2-03, P2-04와 병렬 가능) |
| **Blocks** | 없음 |
| **Blocked By** | P2-01 (CI baseline) |

---

## 개요

Phase 1은 code-first OpenAPI baseline에서 의도적으로 멈췄다. 본 task는 admin/public/internal 엔드포인트의 Swagger 문서 품질을 정비한다 — `@Operation`, `@Schema`, request/response 예제, 에러 envelope 예제, JWT 인증 표시까지.

기능 변경 없음. 외부(또는 사내) 통합 작업의 진입 비용을 낮추는 작업.

---

## 현재 진행 상태

- 메인 Task 상태: 🔴 Not Started
- 메모: api-server / admin-server 모두 `/swagger-ui.html` 가용. v3/api-docs 200. 본문 품질 점검은 미실시.

| SubTask | 상태 | 메모 |
|---------|------|------|
| 5.1 | 🔴 Not Started | 두 서버 OpenAPI 스펙 dump 후 누락/모호 항목 audit |
| 5.2 | 🔴 Not Started | 공개 API (`/api/notices`, `/api/suppliers` 등) 예제 보강 |
| 5.3 | 🔴 Not Started | 인증 필요 API에 JWT scheme 일관 표시 |
| 5.4 | 🔴 Not Started | 에러 응답 envelope 표준 예제 |
| 5.5 | 🔴 Not Started | Tag 정리 + summary/description 한글화 일관성 |
| 5.6 | 🔴 Not Started | (선택) OpenAPI snapshot test |

---

## SubTask 목록

### 🔴 SubTask 5.1: OpenAPI dump audit

**작업자:** Backend
**예상 소요:** 0.25일

- [ ] `curl -s http://localhost:8080/v3/api-docs > /tmp/api.json`
- [ ] `curl -s http://localhost:8081/v3/api-docs > /tmp/admin.json`
- [ ] description 누락, summary 부재, schema 미정의 path 목록화

### 🔴 SubTask 5.2: 공개 API 예제 보강

**작업자:** Backend
**예상 소요:** 0.5일

- [ ] `/api/notices`, `/api/notices/{id}`, `/api/suppliers`, `/api/suppliers/{id}` 응답 예제 추가
- [ ] `@Schema(example=...)` 또는 `@ApiResponse(content=@Content(examples=...))`
- [ ] 페이지네이션 meta 예제

### 🔴 SubTask 5.3: 인증 표시 일관화

**작업자:** Backend
**예상 소요:** 0.25일

- [ ] 인증 필요 엔드포인트에 `@SecurityRequirement(name = "bearerAuth")`
- [ ] 공개 엔드포인트는 보안 요구 제거
- [ ] admin-server는 admin role 명시 (description level)

### 🔴 SubTask 5.4: 에러 envelope 표준 예제

**작업자:** Backend
**예상 소요:** 0.25일

- [ ] 공통 4xx/5xx 응답에 대해 envelope 예제 (`code`, `message`, `errors`, `traceId`)
- [ ] 401/403/404/422/500 표준 예제 1세트
- [ ] global advice 또는 공통 OpenAPI customizer로 일괄 부착

### 🔴 SubTask 5.5: Tag/네이밍 정리

**작업자:** Backend
**예상 소요:** 0.5일

- [ ] 도메인 단위 tag 일관성 (`suppliers`, `requests`, `quotes`, `threads`, `notices`, `admin-reviews`, ...)
- [ ] summary/description 톤 통일
- [ ] PathItem 정렬

### 🔴 SubTask 5.6: OpenAPI snapshot test (선택)

**작업자:** Backend
**예상 소요:** 0.25일

- [ ] api-server / admin-server 각각 `/v3/api-docs` 응답을 fixture와 비교하는 테스트 추가
- [ ] 의도치 않은 계약 변경을 CI가 잡도록 함

---

## 인수 완료 조건 (Acceptance Criteria)

- [ ] 두 서버의 모든 endpoint에 summary/description, request/response 예제, security 표시가 갖춰진다.
- [ ] 표준 에러 envelope 예제가 일관되게 표시된다.
- [ ] Swagger UI를 처음 보는 사람이 외부 도구 없이 주요 흐름을 시도할 수 있다.
- [ ] Evidence: `.sisyphus/evidence/phase2-task-05-swagger-and-contract-polish.txt`

---

## 검증 명령

```bash
cd backend
./gradlew :api-server:test :admin-server:test
# 양쪽 OpenAPI dump 비교
curl -s http://localhost:8080/v3/api-docs | jq '.paths | keys | length'
curl -s http://localhost:8081/v3/api-docs | jq '.paths | keys | length'
```

---

## 의존성 매트릭스

| From | To | 관계 |
|------|-----|------|
| 5.1 audit | 5.2~5.5 | 누락 식별 후 보강 |
| 5.4 에러 envelope | 5.6 snapshot | snapshot 안정화 전에 표준 예제 확정 |

---

## 리스크 및 완화 전략

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| 어노테이션 폭증으로 컨트롤러 가독성 저하 | Low | 공통 customizer로 분리 가능한 부분은 추출 |
| snapshot test가 사소한 변경에 noisy | Medium | 5.6은 선택 항목으로 두고 도입 시 정렬·정렬키 정규화 적용 |

---

## 산출물 (Artifacts)

### 코드
- `backend/api-server/.../bootstrap/OpenApiConfig.kt`
- `backend/admin-server/.../bootstrap/OpenApiConfig.kt`
- 컨트롤러별 어노테이션 추가
- (선택) `OpenApiSnapshotTest.kt`

### 문서
- `.sisyphus/evidence/phase2-task-05-swagger-and-contract-polish.txt`

---

## Commit

```
docs(api): polish public/admin Swagger summaries, examples, security
docs(api): standardize error envelope examples across endpoints
test(api): add OpenAPI snapshot guard
docs(phase2): record task 05 evidence
```

---

**이전 Task**: [Task 04: Supplier Discovery Sort and Index](./phase2-task-04-supplier-discovery-sort-and-index.md)
**다음 Task**: [Task 06: Reviews and Ratings Foundation](./phase2-task-06-reviews-and-ratings-foundation.md)
