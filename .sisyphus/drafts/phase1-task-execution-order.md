# Phase 1 Task Execution Order

> 상태: Working Note
> 목적: Phase 1 구현을 task 단위로 순차 실행하기 위한 실행 순서/진입 문구 정리
> 커밋 규칙: 이 문서는 실행 편의용이며 커밋 대상이 아님

---

## 1. 사용 원칙

- 실행 단위는 `Wave`가 아니라 `Task`다.
- 시작은 항상 선행 의존성이 모두 끝난 가장 앞 task부터 한다.
- 각 task는 `실행 -> 코드 리뷰 -> 완료 판정 -> 다음 task` 순서로 간다.
- 병렬 가능 표시는 참고 정보일 뿐, 현재 운영 방식은 task 순차 실행을 기본값으로 둔다.

---

## 2. 공식 진입 문서

실행 전에 아래 순서로 본다.

1. `.sisyphus/plans/phase1-execution-plan.md`
2. `.sisyphus/plans/phase1-subplans-index.md`
3. 해당 task 문서

---

## 3. Task 실행 순서

| 순서 | Task | 설명 | 기준 문서 |
|------|------|------|-----------|
| 1 | Task 01 | Foundation, Runtime, Swagger/OpenAPI Bootstrap | `.sisyphus/plans/phase1-subplans/phase1-task-01-foundation-runtime-swagger.md` |
| 2 | Task 02 | Auth and Role Skeleton | `.sisyphus/plans/phase1-subplans/phase1-task-02-auth-role-skeleton.md` |
| 3 | Task 03 | Requester Business Approval Gate | `.sisyphus/plans/phase1-subplans/phase1-task-03-requester-approval-gate.md` |
| 4 | Task 04 | Supplier Profile and Verification Submission | `.sisyphus/plans/phase1-subplans/phase1-task-04-supplier-verification.md` |
| 5 | Task 05 | Admin Review Queue and Decision Actions | `.sisyphus/plans/phase1-subplans/phase1-task-05-admin-review-queue.md` |
| 6 | Task 06 | Supplier Discovery and Read Models | `.sisyphus/plans/phase1-subplans/phase1-task-06-supplier-discovery.md` |
| 7 | Task 07 | Request Lifecycle and Targeting | `.sisyphus/plans/phase1-subplans/phase1-task-07-request-lifecycle.md` |
| 8 | Task 08 | Quote Lifecycle and Comparison | `.sisyphus/plans/phase1-subplans/phase1-task-08-quote-lifecycle.md` |
| 9 | Task 09 | Message Threads, Attachments, Read State | `.sisyphus/plans/phase1-subplans/phase1-task-09-message-threads.md` |
| 10 | Task 10 | Contact-Share Consent | `.sisyphus/plans/phase1-subplans/phase1-task-10-contact-share.md` |
| 11 | Task 11 | Admin Notices, Stats and Stabilization | `.sisyphus/plans/phase1-subplans/phase1-task-11-admin-notices-stabilization.md` |

---

## 4. 다음 Task가 열리는 기준

- `Task 01` 완료 후 -> `Task 02`, `Task 03`, `Task 04`, `Task 05` 검토 가능
- 현재 운영 방식은 병렬보다 순차를 우선하므로, 기본 순서는 `Task 02 -> Task 03 -> Task 04 -> Task 05`로 간다.
- 이후에는 아래 순서로 이어간다.
  - `Task 06`
  - `Task 07`
  - `Task 08`
  - `Task 09`
  - `Task 10`
  - `Task 11`

즉, 실무 기본 실행 순서는 다음과 같다.

```text
Task 01
-> Task 02
-> Task 03
-> Task 04
-> Task 05
-> Task 06
-> Task 07
-> Task 08
-> Task 09
-> Task 10
-> Task 11
```

---

## 5. 진입 문구 템플릿

### 5.1 일반 진입 문구

아래 형식으로 시작한다.

```text
Task {NN}부터 시작.
기준 문서:
- .sisyphus/plans/phase1-execution-plan.md
- .sisyphus/plans/phase1-subplans-index.md
- .sisyphus/plans/phase1-subplans/{task-file}.md

이 task만 실행하고,
끝나면 코드 리뷰 후 완료 판정하고,
그 다음 task로 넘어가.
```

### 5.2 Task 01 시작용 문구

```text
Task 01부터 시작.
기준 문서:
- .sisyphus/plans/phase1-execution-plan.md
- .sisyphus/plans/phase1-subplans-index.md
- .sisyphus/plans/phase1-subplans/phase1-task-01-foundation-runtime-swagger.md

Task 01만 실행해.
```

### 5.3 다음 Task 시작용 문구 예시

```text
Task 02부터 시작.
기준 문서:
- .sisyphus/plans/phase1-execution-plan.md
- .sisyphus/plans/phase1-subplans-index.md
- .sisyphus/plans/phase1-subplans/phase1-task-02-auth-role-skeleton.md

Task 02만 실행해.
```

---

## 6. 실행 체크 규칙

각 task 시작 전에 확인:

- 현재 task의 선행 task가 완료됐는가
- 해당 sub-plan 문서를 읽었는가
- 관련 기준 문서(`system-architecture`, `data-model`, `api-spec`)를 같이 봤는가

각 task 종료 후 확인:

- 구현 완료
- 코드 리뷰 완료
- 기준 문서와 충돌 없음 확인
- 다음 task 진입 가능 여부 확인

---

## 7. 메모

- `phase1-execution-plan.md`는 상위 spine이다.
- 실제 작업 지시는 항상 sub-plan 문서를 기준으로 한다.
- 이 문서는 실행 편의용 정리본이며, 필요 시 수시로 갱신한다.
