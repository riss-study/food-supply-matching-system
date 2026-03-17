# Phase 1 Active Baseline

> 상태: Active
> 목적: 현재 Phase 1 문서 체계의 공식 기준점과 우선순위를 정의

---

## 1. 역할

이 문서는 현재 활성 문서 세트와 우선순위를 정의하는 기준 문서다.

문서 충돌이 발생하면 이 문서를 먼저 확인한다.

---

## 2. Active 문서 세트

### 제품 기준

1. `.sisyphus/drafts/1st-phase-requirements-final.md`
2. `.sisyphus/drafts/PRD-v1.0-MVP-Korean.md`
3. `.sisyphus/drafts/PRD-v1.0-MVP-English.md`
4. `.sisyphus/drafts/PRD-v1.0-MVP.md`

### 아키텍처 / 데이터 / 계약

5. `.sisyphus/drafts/system-architecture.md`
6. `.sisyphus/drafts/data-model.md`
7. `.sisyphus/drafts/api-spec.md`

### 구현 가이드

8. `.sisyphus/drafts/backend-guide.md`
9. `.sisyphus/drafts/frontend-guide.md`
10. `.sisyphus/drafts/design-system.md`

### 실행 준비

11. `.sisyphus/drafts/acceptance-scenarios-and-backlog.md`
12. `.sisyphus/drafts/phase1-policy-closure-log.md`
13. `.sisyphus/drafts/phase1-execution-foundation.md`
14. `.sisyphus/drafts/phase1-development-entry-guide.md`

### 실행 계획

15. `.sisyphus/plans/phase1-execution-plan.md`
16. `.sisyphus/plans/phase1-subplans-index.md`
17. `.sisyphus/plans/phase1-subplans/`

---

## 3. 우선순위 규칙

문서 충돌 시 아래 순서로 우선한다.

1. `phase1-active-baseline.md`
2. `1st-phase-requirements-final.md`
3. `PRD-v1.0-MVP-Korean.md`
4. `system-architecture.md`
5. `data-model.md`
6. `api-spec.md`
7. `backend-guide.md`, `frontend-guide.md`, `design-system.md`
8. `acceptance-scenarios-and-backlog.md`
9. `phase1-policy-closure-log.md`
10. `phase1-execution-plan.md`
11. `phase1-subplans-index.md` 및 각 sub-plan 문서

---

## 4. 실행 규칙

- 실제 착수, 코드 리뷰, 완료 판정 단위는 `Task`다.
- `Wave`는 active 실행 기준이 아니라 병렬 참고 정보로만 사용한다.
- `/start-work`는 `phase1-subplans-index.md`에서 해당 task를 찾고, 개별 task 문서를 기준으로 실행한다.

---

## 5. Archive 규칙

- 더 이상 기준이 아닌 문서는 `.sisyphus/archive/` 아래로 이동한다.
- archive 문서는 기록 보존용이다.
- archive 문서와 active 문서가 충돌하면 항상 active 문서를 우선한다.
