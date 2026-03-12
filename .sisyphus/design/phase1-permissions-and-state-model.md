# Phase 1 권한 및 상태 모델

> 버전: 1.0
> 상태: Active
> 상위 문서: `phase1-design-baseline.md`

---

## 1. 역할

- Guest
- Requester
- Supplier
- Admin

---

## 1.5 요청자 사업자 승인 게이트

### 요청자 사업자 상태

`not_submitted -> submitted -> approved`

추가 전이:

- `submitted -> rejected`

### 규칙

- 요청자는 승인 전에도 가입 / 로그인할 수 있다.
- `approved` 상태인 요청자만 의뢰 생성 / 수정 / 게시가 가능하다.
- `submitted`와 `rejected` 상태의 요청자는 탐색과 계정 관리만 가능하고 의뢰 생성은 할 수 없다.

---

## 2. 공급자 검수 상태 모델

### 공급자 검수 상태

`draft -> submitted -> under_review -> approved`

추가 전이:

- `under_review -> hold`
- `hold -> submitted`
- `under_review -> rejected`
- `rejected -> submitted`
- `approved -> suspended`
- `suspended -> under_review`

### 비즈니스 의미

| 상태 | 의미 |
|------|------|
| draft | 공급자가 아직 완전한 검수 제출을 하지 않음 |
| submitted | 공급자가 검수를 요청함 |
| under_review | 관리자가 실제 검토 중 |
| hold | 추가 서류나 정보 보완이 필요함 |
| approved | Phase 1에서 일반적인 활동이 가능한 신뢰 상태 |
| rejected | 현재 제출 건이 승인되지 않아 수정 후 재제출 필요 |
| suspended | 관리자에 의해 노출 / 참여 권한이 제한됨 |

---

## 3. 공급자 노출 규칙

| 검수 상태 | 검색 노출 | 공급자 상세 노출 | 견적 참여 가능 |
|-----------|-----------|------------------|----------------|
| draft | 숨김 | 본인 / 관리자만 | 불가 |
| submitted | 숨김 | 본인 / 관리자만 | 불가 |
| under_review | 숨김 | 본인 / 관리자만 | 불가 |
| hold | 숨김 | 본인 / 관리자만 | 불가 |
| approved | 노출 | 공개 / 요청자에게 노출 | 가능 |
| rejected | 숨김 | 본인 / 관리자만 | 불가 |
| suspended | 숨김 | 본인 / 관리자만 | 불가 |

---

## 4. 의뢰 상태 모델

`draft -> open -> closed`

추가 전이:

- `draft -> cancelled`
- `open -> cancelled`

규칙:

- `open` 상태의 의뢰만 새 견적을 받을 수 있다.
- `closed`는 요청자가 더 이상 새 견적을 받지 않는 상태다.
- `cancelled`는 거래 관련 액션이 비활성화되거나 숨겨져야 한다는 뜻이다.

---

## 5. 견적 상태 모델

`submitted -> selected`

추가 전이:

- `submitted -> withdrawn`
- `submitted -> declined`

규칙:

- 공급자는 의뢰당 active 견적을 최대 1개만 가질 수 있다.
- 요청자는 견적을 `selected` 또는 `declined`로 전환할 수 있다.
- 공급자는 본인 견적이 `submitted`일 때만 `withdrawn`으로 전환할 수 있다.
- 견적 PATCH는 `submitted` 상태에서만 가능하다.
- 견적 PATCH는 가격 / MOQ / 납기 / 샘플 비용 / 메모만 수정할 수 있다.
- 견적 PATCH는 수정 이력을 반드시 남겨야 한다.

---

## 6. 연락처 공유 상태 모델

`not_requested -> requested -> one_side_approved -> mutually_approved`

추가 전이:

- 최종 상태 전에는 `revoked`로 갈 수 있다.

규칙:

- 외부 연락처는 `mutually_approved`에서만 보인다.
- revoke는 `requested`와 `one_side_approved` 상태에서만 가능하다.
- `revoked` 이후에는 새로운 동의 cycle을 다시 만들 수 있다.
- 이미 `mutually_approved`로 공개된 연락처는 revoke로 다시 숨겨지지 않는다.

---

## 7. 권한 매트릭스

| 리소스 / 액션 | Guest | Requester | Supplier | Admin |
|---------------|-------|-----------|----------|-------|
| 공개 공급자 목록 보기 | 가능 | 가능 | 가능 | 가능 |
| 승인된 공급자 상세 보기 | 제한적 가능 | 가능 | 가능 | 가능 |
| 의뢰 생성 | 불가 | 승인된 요청자만 | 불가 | 불가 |
| 본인 의뢰 수정 | 불가 | 승인된 요청자만 | 불가 | 가능 |
| open 의뢰 보기 | 불가 | 소유자 + 응답 가능 공급자 | 응답 가능 공급자 | 가능 |
| 견적 제출 | 불가 | 불가 | 승인된 공급자만 | 불가 |
| 견적 비교 | 불가 | 의뢰 소유자 | 불가 | 가능 |
| 스레드 메시지 전송 | 불가 | 스레드 참여자 | 스레드 참여자 | 감사 목적으로만 |
| 연락처 공유 요청 | 불가 | 스레드 참여자 | 스레드 참여자 | 불가 |
| 검수 승인 | 불가 | 불가 | 불가 | 가능 |
| 공급자 상태 변경 | 불가 | 불가 | 불가 | 가능 |
| 공지 관리 | 불가 | 불가 | 불가 | 가능 |

---

## 8. Guard Rules

1. 미승인 공급자는 검색에 나타나면 안 된다.
2. 미승인 공급자는 견적을 제출하면 안 된다.
3. 요청자는 자기 의뢰의 견적만 비교할 수 있다.
4. 메시지 스레드는 참여자와 감사 목적으로 접근하는 관리자만 볼 수 있다.
5. 관리자 반려에는 사유 코드 또는 설명 메모가 필요하다.
6. suspended 공급자는 즉시 노출과 견적 참여 권한을 잃는다.

---

## 9. 관리자 검수 결정 규칙

### 검수 결과

- approve
- hold
- reject
- resubmission

### 최소 입력값

- decision
- reviewer id
- timestamp
- internal note
- rejected 또는 resubmission 안내 시 보여줄 user-visible note

### 결과 의미

- `hold`: 추가 정보가 필요함. 공급자는 계속 숨김 / 참여 불가 상태이며 재제출이 예상된다.
- `reject`: 현재 제출 건이 승인되지 않음. 공급자는 계속 숨김 / 참여 불가 상태이며 이후 재제출 가능하다.
- `resubmission`: 공급자 액션으로, hold 또는 rejected 상태의 제출을 다시 `submitted`로 올리는 행동이다.

### 사용자 노출 문구

- `hold`: `추가 서류 또는 정보 보완이 필요합니다. 내용을 보완한 뒤 다시 제출해주세요.`
- `reject`: `이번 제출은 승인되지 않았습니다. 내용을 수정한 뒤 다시 제출해주세요.`
