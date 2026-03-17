# Design Doc Migration Map

> 상태: Draft
> 목적: 기존 `.sisyphus/design/*` 문서를 새 draft 문서 세트로 어떻게 흡수하거나 archive 처리할지 정리
> 새 기준 세트: `system-architecture.md`, `data-model.md`, `api-spec.md`, `backend-guide.md`, `frontend-guide.md`, `design-system.md`

---

## 1. 원칙

- 기존 설계 문서를 바로 삭제하지 않는다.
- 먼저 새 문서 세트가 역할을 대체했는지 확인한 뒤 `Archive` 또는 `Partially Absorbed`로 내린다.
- 새 세트에 없는 고유 역할이 남아 있는 문서는 성급히 archive하지 않는다.
- retired 문서의 물리 경로 기본값은 `.sisyphus/archive/design/phase1/`로 잡는다.
- `deprecated`보다 `archive`를 우선 사용한다. 이유는 현재 문서들은 더 이상 기준은 아니지만 기록 보존 가치는 있기 때문이다.

---

## 2. Legacy -> New Mapping

### 2.1 `phase1-design-baseline.md`

- 기존 역할:
  - Phase 1 범위 기준선 고정
  - 핵심 객체 / 불변 규칙 / 포함/제외 범위 요약
- 새 반영 문서:
  - `system-architecture.md`
  - `data-model.md`
  - `api-spec.md`
- 판정: `Fully Replaced`
- 처리 권장:
  - 새 문서 세트가 상위 기준 역할을 수행하므로 archive 후보
- 남길 고유 내용:
  - 포함/제외 범위 문맥은 필요 시 요구사항/PRD와 함께 cross-check 용도로만 보존

### 2.2 `phase1-information-architecture-and-flows.md`

- 기존 역할:
  - 화면 영역 지도
  - 사용자별 내비게이션
  - 핵심 흐름/실패 흐름
  - 객체-화면 매핑
- 새 반영 문서:
  - `system-architecture.md` (앱 경계 / 사이트 역할)
  - `frontend-guide.md` (앱 경계 / 라우팅 기준)
  - `design-system.md` (페이지 패턴)
- 판정: `Replaced By New Draft`
- 처리 권장:
  - archive 후보
- 남길 고유 내용:
  - 없음. 핵심 흐름, 객체-화면 매핑, UI 노출 규칙이 새 draft 세트로 이관되었다.

### 2.3 `phase1-permissions-and-state-model.md`

- 기존 역할:
  - 상태 전이
  - 역할/권한 매트릭스
  - guard rule
  - admin hold/reject/resubmission semantics
- 새 반영 문서:
  - `data-model.md` (상태 모델 / 권한·노출 규칙)
  - `api-spec.md` (role/state validation rule)
- 판정: `Replaced By New Draft`
- 처리 권장:
  - archive 후보
- 남길 고유 내용:
  - 없음. 권한 매트릭스와 사용자 노출 문구 원문이 새 draft 세트로 이관되었다.

### 2.4 `phase1-domain-and-data-model.md`

- 기존 역할:
  - aggregate 목록
  - write/read store ownership
  - 관계 / 유니크 조건
  - projection 메모
- 새 반영 문서:
  - `data-model.md`
- 판정: `Fully Replaced`
- 처리 권장:
  - archive 후보
- 남길 고유 내용:
  - 기존 field naming을 회귀 검토용으로만 보존 가능

### 2.5 `phase1-api-and-validation-spec.md`

- 기존 역할:
  - endpoint 그룹
  - validation rule
  - 응답 / 에러 규칙
- 새 반영 문서:
  - `api-spec.md`
- 판정: `Fully Replaced`
- 처리 권장:
  - archive 후보
- 남길 고유 내용:
  - 없음. 새 문서가 직접 대체함

### 2.6 `phase1-acceptance-scenarios-and-backlog.md`

- 기존 역할:
  - happy/negative scenario
  - seed data
  - traceability matrix
  - vertical slice backlog
- 새 반영 문서:
  - `acceptance-scenarios-and-backlog.md`
  - 일부 traceability 해석은 `backend-guide.md`, `frontend-guide.md`, `api-spec.md`, `data-model.md`와 연결됨
- 판정: `Replaced By New Draft`
- 처리 권장:
  - 새 draft 기준으로 archive 후보 재검토 가능
  - 필요하면 나중에 acceptance와 backlog를 두 문서로 재분리
- 남길 고유 내용:
  - happy/negative scenario 묶음
  - seed data baseline
  - traceability matrix
  - vertical slice backlog

---

## 3. Archive Priority

### 바로 archive 후보

- `phase1-design-baseline.md`
- `phase1-domain-and-data-model.md`
- `phase1-api-and-validation-spec.md`

### 부분 흡수 후 archive 검토

- 없음

### 아직 유지 필요

- 없음

---

## 4. Recommended Archive Folder Layout

```text
.sisyphus/
├── drafts/
├── plans/
└── archive/
    └── design/
        └── phase1/
            ├── phase1-design-baseline.md
            ├── phase1-information-architecture-and-flows.md
            ├── phase1-permissions-and-state-model.md
            ├── phase1-domain-and-data-model.md
            ├── phase1-api-and-validation-spec.md
            └── phase1-acceptance-scenarios-and-backlog.md
```

이 구조를 기본값으로 권장한다.

---

## 5. Follow-up Propagation Work

기존 legacy design 문서명을 직접 참조하는 문서들은 후속 반영이 필요했다.

우선 대상:

- `PRD-v1.0-MVP-Korean.md`
- `PRD-v1.0-MVP-English.md`
- `PRD-v1.0-MVP.md`
- `1st-phase-requirements-final.md`
- `phase1-development-entry-guide.md`
- `phase1-active-baseline.md`

위 문서들은 새 기준 문서 세트(`system-architecture.md`, `data-model.md`, `api-spec.md`) 또는 새 가이드 세트로 링크/참조를 갱신했다.

---

## 6. Recommended Next Order

1. legacy design 문서 참조를 새 draft 세트로 전파
2. fully replaced 문서부터 `Archive` 상태로 전환
3. partially absorbed 문서는 고유 내용 이관 후 archive 여부 재판정
