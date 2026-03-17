# Phase 1 정책 확정 로그

> 버전: v1.0
> 작성일: 2026-03-12
> 상태: Active
> 목적: 코딩 직전 질문 답변을 구현 가능한 정책으로 고정하는 문서
> 입력 문서: `phase1-pre-coding-questions.md`
> 상위 기준: `1st-phase-requirements-final.md`, `PRD-v1.0-MVP-Korean.md`, `.sisyphus/design/*.md`

---

## 1. 문서 목적

이 문서는 코딩 시작 전 반드시 고정해야 하는 5개 운영 규칙을 최종 정책으로 기록한다.

이 문서에 적힌 내용은 더 이상 구현자가 추측으로 결정하면 안 된다.

---

## 2. 확정된 정책

### P1. 메시지 스레드 생성 규칙

최종 결정:

- 메시지 스레드는 **두 가지 방식 모두 허용**한다.
  - 자동 생성: 공급자가 첫 견적을 제출하는 순간
  - 수동 생성: 요청자가 특정 공급자에게 `상담 시작`을 누르는 순간

추가 고정 규칙:

- 같은 `(request_id, requester_user_id, supplier_profile_id)` 조합에는 **활성 스레드 1개만 존재**한다.
- 자동/수동 생성 요청이 들어와도 기존 스레드가 있으면 **새로 만들지 않고 기존 스레드로 연결**한다.
- 수동 생성은 아래 조건에서만 허용한다.
  - 요청자가 해당 의뢰의 소유자여야 한다.
  - 대상 공급자가 승인된 공급자여야 한다.
  - 공개 의뢰면 승인된 공급자를 대상으로 시작 가능하다.
  - 선택 공급자 대상 의뢰면 선택된 공급자에게만 시작 가능하다.

의미:

- 견적이 오면 자동으로 대화가 열릴 수 있다.
- 요청자도 필요하면 먼저 대화를 시작할 수 있다.
- 하지만 같은 상대와 같은 의뢰로 채팅방이 여러 개 생기면 안 된다.

---

### P2. 요청자 사업자 승인 게이트

최종 결정:

- 요청자는 **가입 가능**하다.
- 하지만 **사업자 승인 전에는 의뢰 등록 불가**다.

추가 고정 규칙:

- 요청자는 가입 후 사업자 정보를 제출할 수 있다.
- 요청자 사업자 상태 기본 모델은 아래로 고정한다.
  - `not_submitted`
  - `submitted`
  - `approved`
  - `rejected`
- `approved` 상태인 요청자만 아래 행동이 가능하다.
  - 의뢰 생성
  - 의뢰 수정
  - 의뢰 공개 등록
- `submitted` 또는 `rejected` 상태에서는 로그인/조회는 가능하지만 의뢰 작성 액션은 막는다.

의미:

- 회원가입은 먼저 할 수 있다.
- 하지만 실제 의뢰 등록은 승인된 사업자만 가능하다.

---

### P3. 견적 수정(PATCH) 규칙

최종 결정:

- 견적 수정은 **선택되기 전까지만 가능**하다.
- 그리고 **수정 이력은 저장**한다.

추가 고정 규칙:

- 수정 가능한 상태는 `submitted` 뿐이다.
- 아래 상태에서는 수정할 수 없다.
  - `selected`
  - `declined`
  - `withdrawn`
- 수정 가능한 필드는 아래로 고정한다.
  - `unit_price_estimate`
  - `moq`
  - `lead_time`
  - `sample_cost`
  - `note`
- 수정 불가능한 필드는 아래로 고정한다.
  - `request_id`
  - `supplier_profile_id`
  - `state`
- PATCH가 발생하면 이전 값은 이력으로 남기고, 감사 로그 또는 수정 이력 테이블/스냅샷에 기록한다.

의미:

- 공급자는 아직 선택되지 않은 견적만 수정할 수 있다.
- 수정은 허용하지만, 몰래 덮어쓰면 안 된다.

---

### P4. 연락처 공유 revoke / retry 규칙

최종 결정:

- 연락처 공유 요청은 **철회 가능**하다.
- 철회 후 **나중에 다시 요청 가능**하다.

추가 고정 규칙:

- revoke는 아래 상태에서만 가능하다.
  - `requested`
  - `one_side_approved`
- `mutually_approved` 이후에는 revoke로 이미 공개된 연락처를 다시 숨기는 기능은 제공하지 않는다.
- retry는 `revoked` 이후 새로운 consent cycle을 생성하는 방식으로 처리한다.
- 이전 요청/철회 기록은 감사 추적을 위해 남긴다.

의미:

- 한쪽이 마음을 바꾸면 철회할 수 있다.
- 나중에 다시 합의하고 싶으면 다시 요청할 수 있다.
- 다만 이미 서로 공개된 연락처를 시스템이 다시 회수해주지는 않는다.

---

### P5. 관리자 검수 결과 의미

최종 결정:

- 추천 기본값으로 간다.
  - `hold`: 추가 확인 필요, 아직 최종 반려 아님
  - `reject`: 현재 제출 건 반려
  - `resubmission`: `hold` 또는 `reject` 이후 수정해서 다시 제출 가능

추가 고정 규칙:

- `hold`는 추가 서류 또는 정보 보완이 필요한 상태다.
- `hold` 상태의 공급자는 검색 노출 및 견적 참여가 불가하다.
- `reject`는 현재 제출 건이 승인되지 않았다는 뜻이다.
- `reject` 상태의 공급자도 검색 노출 및 견적 참여가 불가하다.
- `resubmission`은 별도 최종 상태가 아니라, 공급자가 수정 후 다시 제출하는 행동이다.
- 구현 상태 모델은 아래로 고정한다.
  - `draft -> submitted -> under_review -> approved`
  - `under_review -> hold`
  - `hold -> submitted`
  - `under_review -> rejected`
  - `rejected -> submitted`
  - `approved -> suspended`
  - `suspended -> under_review`

사용자 표시 문구:

- `hold`: `추가 서류 또는 정보 보완이 필요합니다. 내용을 보완한 뒤 다시 제출해주세요.`
- `reject`: `이번 제출은 승인되지 않았습니다. 내용을 수정한 뒤 다시 제출해주세요.`

의미:

- hold는 “보완 후 다시 보자”에 가깝다.
- reject는 “이번 제출은 승인 안 됨”이다.
- 둘 다 다시 제출은 가능하지만, 승인 전까지는 노출/활동 권한이 없다.

---

## 3. 구현 반영 대상

이 문서 내용은 최소 아래 문서에 연쇄 반영해야 한다.

- `.sisyphus/plans/phase1-execution-plan.md`
- `.sisyphus/plans/phase1-subplans-index.md`
- `.sisyphus/drafts/1st-phase-requirements-final.md`
- `.sisyphus/drafts/PRD-v1.0-MVP-Korean.md`
- `.sisyphus/drafts/PRD-v1.0-MVP-English.md`
- `.sisyphus/drafts/system-architecture.md`
- `.sisyphus/drafts/data-model.md`
- `.sisyphus/drafts/api-spec.md`
- `.sisyphus/drafts/acceptance-scenarios-and-backlog.md`

---

## 4. 현재 판단

- 5개 운영 규칙은 이제 business answer 기준으로 닫혔다.
- 다음 남은 planning blocker는 `phase1-execution-foundation.md`다.
- 즉, 정책 blocker는 해결됐고, 이제 실행 기반 정리만 남았다.
