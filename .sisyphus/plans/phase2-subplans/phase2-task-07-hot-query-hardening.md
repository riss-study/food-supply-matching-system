# Phase 2 Task 07 - Hot Query 하드닝

## 메인 Task 메타데이터

| 항목 | 값 |
|------|-----|
| **메인 Task ID** | P2-07 |
| **Wave** | 4 (Scalability & Operability Gate) |
| **우선순위** | P3 |
| **기간** | 2-3일 |
| **스토리 포인트** | 8 |
| **작업자** | Backend |
| **상태** | 🔴 Not Started |
| **Can Parallel** | NO (Wave 3 결과 데이터에 기반) |
| **Blocks** | 없음 |
| **Blocked By** | P2-04, P2-06 (실제 hot read 패턴 식별 후) |

---

## 개요

Phase 2 마지막 wave. Phase 1~Phase 2 Wave 3까지 운영하면서 드러난 가장 뜨거운 read 경로 — 특히 **in-memory에서 필터/정렬되던 read** — 를 repository-backed pagination/sort로 교체한다. 동시에 admin stats aggregation 비용이 보이기 시작했는지 재검토한다.

scaling을 위한 사전 작업이 아니라, **이미 보이는 비용**을 닫는 작업.

---

## 현재 진행 상태

- 메인 Task 상태: 🔴 Not Started
- 메모: 실제 hot path가 무엇인지는 Wave 3까지 진행 후 측정해야 함. 본 plan은 후보군과 점검 절차만 제시.

| SubTask | 상태 | 메모 |
|---------|------|------|
| 7.1 | 🔴 Not Started | hot query 후보 목록 작성 (search, list, stats) |
| 7.2 | 🔴 Not Started | 실측: 응답시간 + DB profile |
| 7.3 | 🔴 Not Started | 후보 1: supplier 탐색 (Task 04 후속) |
| 7.4 | 🔴 Not Started | 후보 2: 의뢰/견적 목록 페이지네이션·정렬 |
| 7.5 | 🔴 Not Started | 후보 3: admin stats projection/캐싱 결정 |
| 7.6 | 🔴 Not Started | 회귀 테스트 + evidence |

---

## SubTask 목록

### 🔴 SubTask 7.1: 후보 식별

**작업자:** Backend
**예상 소요:** 0.25일

- [ ] 코드 grep: `.toList().filter { ... }` 등 in-memory 필터 잔재
- [ ] read 모듈에서 `findAll()` 후 application 계층 정렬 패턴
- [ ] 후보 목록을 evidence에 명시

### 🔴 SubTask 7.2: 실측

**작업자:** Backend
**예상 소요:** 0.5일

- [ ] 더미 데이터 1k/10k row로 seed 보강
- [ ] 후보별 응답시간 측정 (curl + jq + time)
- [ ] MariaDB `EXPLAIN`, Mongo `explain('executionStats')` 캡처

### 🔴 SubTask 7.3: supplier 탐색 잔재 정리

**작업자:** Backend
**예상 소요:** 0.5일

- [ ] Task 04에서 남은 in-memory 잔재 제거
- [ ] Mongo aggregation 또는 find with index 사용
- [ ] cursor-based pagination 검토 (offset 비대화 시)

### 🔴 SubTask 7.4: 의뢰/견적 목록

**작업자:** Backend
**예상 소요:** 0.5일

- [ ] requester request list, supplier request feed, quote list 정렬·필터를 query-model 레벨로
- [ ] 인덱스: `(requesterUserId, status, createdAt desc)`, `(supplierProfileId, createdAt desc)`
- [ ] 페이지네이션 meta 일관

### 🔴 SubTask 7.5: admin stats 재검토

**작업자:** Backend
**예상 소요:** 0.5일

- [ ] 현재 deterministic aggregation 비용 측정
- [ ] 결정 분기:
  - [ ] 비용이 작으면 유지 (decision note만 기록)
  - [ ] 비용이 보이면 일별 projection 또는 캐시 도입
- [ ] 결정 노트 evidence에 기록

### 🔴 SubTask 7.6: 회귀 테스트

**작업자:** Backend
**예상 소요:** 0.25일

- [ ] 변경 전후 응답 동등성 테스트
- [ ] e2e smoke 통과
- [ ] 평균 응답시간 비교표

---

## 인수 완료 조건 (Acceptance Criteria)

- [ ] 식별된 hot read 경로에서 in-memory 필터/정렬이 제거되었거나, 유지하기로 한 명시적 결정 노트가 존재한다.
- [ ] 의뢰/견적/공급자 탐색 목록이 인덱스 기반으로 동작한다.
- [ ] admin stats는 trade-off 결정 후 그에 맞게 projection/캐시/유지 중 하나를 적용한다.
- [ ] 변경 전후 회귀 테스트 통과.
- [ ] Evidence: `.sisyphus/evidence/phase2-task-07-hot-query-hardening.txt`

---

## 검증 명령

```bash
cd backend
./gradlew :api-server:test :admin-server:test :query-model-supplier:test :query-model-request:test :query-model-quote:test
# 측정
time curl -s 'http://localhost:8080/api/suppliers?page=1&size=20' >/dev/null
time curl -s 'http://localhost:8080/api/requests?page=1&size=20' >/dev/null
time curl -s 'http://localhost:8081/api/admin/stats/summary' >/dev/null
```

---

## 의존성 매트릭스

| From | To | 관계 |
|------|-----|------|
| 7.1 후보 식별 | 7.2 실측 | 후보 확정 후 측정 |
| 7.2 실측 | 7.3, 7.4, 7.5 | 측정 결과로 우선순위 |
| 7.3, 7.4, 7.5 | 7.6 회귀 | 변경 후 안정화 검증 |

---

## 리스크 및 완화 전략

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| 측정 없이 최적화 | High | 7.2 선결, 비용 안 보이면 그대로 유지 |
| 인덱스 추가가 write 성능 저하 | Medium | EXPLAIN 결과로 read 이득과 비교 |
| projection 신규 도입 시 데이터 일관성 깨짐 | High | dual-read 일정 기간 + 반드시 transactional 적용 |
| 페이지네이션 방식 변경으로 클라이언트 깨짐 | Medium | 기존 envelope 유지, cursor는 신규 endpoint로 격리 |

---

## 산출물 (Artifacts)

### 코드
- `backend/query-model-*` 정렬/필터 정리
- 신규 인덱스 정의 (MariaDB/Mongo)
- (선택) admin stats projection/cache 모듈

### 문서
- 측정 표 (전/후)
- decision note (admin stats)
- `.sisyphus/evidence/phase2-task-07-hot-query-hardening.txt`

---

## Commit

```
perf(query): replace in-memory filter/sort with repository-backed paths
perf(db): add indexes for request/quote list hot paths
perf(admin-stats): introduce projection/cache OR record decision note
test(query): regression coverage for hardened read paths
docs(phase2): record task 07 evidence
```

---

**이전 Task**: [Task 06: Reviews and Ratings Foundation](./phase2-task-06-reviews-and-ratings-foundation.md)
**다음 Task**: 없음 (Phase 2 첫 마일스톤 종료 — Phase 2+ 또는 launch milestone 진입)
