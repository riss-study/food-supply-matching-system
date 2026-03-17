# Acceptance Scenarios and Backlog

> 상태: Active Execution Baseline
> 범위: Phase 1 수용 시나리오 및 실행 준비
> 기준 문서: `system-architecture.md`, `data-model.md`, `api-spec.md`, `backend-guide.md`, `frontend-guide.md`, `design-system.md`

---

## 1. 목적과 범위

이 문서는 Phase 1의 happy path, negative path, 최소 seed data, vertical slice backlog를 한 곳에 정리한 실행 준비 문서다.

이 문서의 책임:

- 기능별 happy / negative path 시나리오 기준 제공
- QA 및 evidence 수집의 출발점 제공
- 구현 slice 순서와 범위 정의
- seed data 기준 제공

---

## 2. Happy Path Scenarios

### 요청자 Happy Path

1. 요청자 가입
2. 요청자 사업자 정보 제출
3. 승인된 공급자 검색
4. 공급자 상세 조회
5. 의뢰 생성
6. 승인된 공급자의 견적 제출
7. 견적 비교
8. 메시지 스레드 개설
9. 양측 연락처 공유 동의

### 공급자 Happy Path

1. 공급자 가입
2. 공급자 프로필 생성
3. 검수 서류 제출
4. 관리자 승인
5. 검색 결과 노출
6. open 의뢰에 견적 제출
7. 메시지 스레드 대화 진행

### 관리자 Happy Path

1. 검수 큐 접근
2. 제출 건 확인
3. 사유 기재 후 승인/반려/보류 결정
4. 시스템 뷰에서 공급자 상태 변경 확인
5. 공지 게시
6. 기초 운영 지표 확인

---

## 3. Negative Scenarios

- 미승인 공급자는 검색 결과에 노출되지 않는다.
- 미승인 공급자는 견적을 제출할 수 없다.
- 요청자는 다른 요청자의 의뢰 견적을 볼 수 없다.
- 공급자는 종료된 의뢰에 견적을 제출할 수 없다.
- 한쪽만 연락처 공유에 동의하면 연락처는 공개되지 않는다.
- 유효하지 않은 파일 업로드는 거부된다.
- 정책상 필요한 경우 관리자는 사유 없이 반려할 수 없다.

---

## 4. 최소 Seed Data

### 계정

- requester-approved 계정 1개
- supplier-draft 계정 1개
- supplier-approved 계정 1개
- admin 계정 1개

### 비즈니스 데이터

- 서로 다른 카테고리/지역을 가진 공급자 프로필 2개
- open public request 1개
- targeted request 1개
- 하나의 의뢰에 대한 견적 2개
- active message thread 1개
- published notice 1개

---

## 5. Traceability Matrix

| 기능 | 핵심 테스트 유형 | 기준 문서 |
|------|------------------|-----------|
| 인증 및 역할 선택 | auth, role, validation | `api-spec.md`, `data-model.md` |
| 공급자 검수 | state transition, admin decision, permission | `data-model.md`, `api-spec.md` |
| 공급자 탐색 | projection, filter, visibility | `data-model.md`, `api-spec.md` |
| 의뢰 생성 | validation, ownership | `api-spec.md`, `data-model.md` |
| 견적 제출 | permission, state, duplicate prevention | `api-spec.md`, `data-model.md` |
| 메시징 | participant access, attachment validation | `api-spec.md`, `data-model.md` |
| 연락처 공유 | bilateral consent, visibility gating | `api-spec.md`, `data-model.md` |
| 관리자 공지 및 통계 | admin auth, read visibility | `api-spec.md`, `system-architecture.md` |

---

## 6. Vertical Slice Backlog

1. Auth 및 역할 skeleton
2. 요청자 사업자 승인 게이트
3. 공급자 프로필 및 검수 제출
4. 관리자 검수 큐 및 결정 액션
5. 공급자 검색 및 상세 read model
6. 의뢰 라이프사이클 및 targeting
7. 견적 제출, 비교, 선택/거절
8. 메시지 스레드, 첨부, 읽음 상태
9. 연락처 공유 동의
10. 공지 및 기초 통계

---

## 7. Slice Ready 기준

하나의 slice는 아래 항목을 모두 포함해야 ready 상태다.

- mapped flow
- 명시적 permissions
- 명시적 state transitions
- 필수 필드 및 validation rules
- API endpoints
- acceptance 및 rejection 시나리오

---

## 8. 문서 읽기 순서

1. `system-architecture.md`
2. `data-model.md`
3. `api-spec.md`
4. `backend-guide.md` 또는 `frontend-guide.md`
5. 이 문서
6. `phase1-execution-plan.md`
7. `phase1-subplans-index.md`
