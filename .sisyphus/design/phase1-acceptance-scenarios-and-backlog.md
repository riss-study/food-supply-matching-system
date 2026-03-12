# Phase 1 수용 시나리오 및 백로그

> 버전: 1.0
> 상태: Active
> 상위 문서: `phase1-design-baseline.md`

---

## 1. 수용 시나리오 묶음

### 요청자 Happy Path

1. 요청자가 가입한다.
2. 요청자가 사업자 정보를 제출한다.
3. 요청자가 승인된 공급자를 검색한다.
4. 요청자가 공급자 상세를 본다.
5. 요청자가 의뢰를 생성한다.
6. 승인된 공급자가 견적을 제출한다.
7. 요청자가 견적을 비교한다.
8. 요청자가 메시지 스레드를 연다.
9. 양쪽이 연락처 공유에 동의한다.

### 공급자 Happy Path

1. 공급자가 가입한다.
2. 공급자가 프로필을 생성한다.
3. 공급자가 검수 서류를 제출한다.
4. 관리자가 공급자를 승인한다.
5. 공급자가 검색에 노출된다.
6. 공급자가 open 의뢰에 견적을 제출한다.
7. 공급자가 메시지 스레드 대화를 이어간다.

### 관리자 Happy Path

1. 관리자가 검수 큐를 연다.
2. 관리자가 제출 건을 확인한다.
3. 관리자가 사유와 함께 승인 또는 반려한다.
4. 관리자가 시스템 뷰에서 공급자 상태 변경을 확인한다.
5. 관리자가 공지를 게시한다.

---

## 2. 핵심 Negative Scenario

- 미승인 공급자는 검색에 나타날 수 없다.
- 미승인 공급자는 견적을 제출할 수 없다.
- 요청자는 다른 요청자의 의뢰 견적을 비교할 수 없다.
- 공급자는 종료된 의뢰에 견적을 낼 수 없다.
- 한쪽만 연락처 공유에 동의해도 연락처는 공개되면 안 된다.
- 잘못된 파일 업로드는 거절돼야 한다.
- 정책상 필요하면, 관리자는 사유 없이 반려할 수 없다.

---

## 3. 최소 Seed Data

### 계정

- requester-approved 계정 1개
- supplier-draft 계정 1개
- supplier-approved 계정 1개
- admin 계정 1개

### 비즈니스 데이터

- 서로 다른 카테고리 / 지역을 가진 공급자 프로필 2개
- open public request 1개
- targeted request 1개
- 하나의 의뢰에 대한 quote 2개
- active message thread 1개
- published notice 1개

---

## 4. Traceability Matrix

| 기능 | 핵심 테스트 유형 |
|------|------------------|
| 인증 및 역할 선택 | auth, role, validation |
| 공급자 검수 | state transition, admin decision, permission |
| 공급자 탐색 | projection, filter, visibility |
| 의뢰 생성 | validation, ownership |
| 견적 제출 | permission, state, duplicate prevention |
| 메시징 | participant access, attachment validation |
| 연락처 공유 | bilateral consent, visibility gating |
| 관리자 공지/통계 | admin auth, read visibility |

---

## 5. 권장 Vertical Slice 백로그

1. auth and role skeleton
2. supplier profile and verification submission
3. admin review queue and decision actions
4. supplier search and detail read model
5. request creation and request lifecycle
6. quote submission and comparison
7. message thread, attachments, read state
8. contact-share consent
9. notices and basic stats

---

## 6. 코딩 시작 준비 완료 기준

하나의 slice는 아래가 모두 있어야 ready 상태다.

- mapped flow
- explicit permissions
- explicit state transitions
- required fields and validation rules
- API endpoints
- acceptance and rejection scenarios
