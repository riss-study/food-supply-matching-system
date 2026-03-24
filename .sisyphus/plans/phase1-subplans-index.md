# Phase 1 Sub-plans Index

## 역할

이 문서는 `.sisyphus/plans/phase1-execution-plan.md`의 11개 main task와
`.sisyphus/plans/phase1-subplans/` 아래 상세 sub-plan 문서를 공식적으로 연결하는 인덱스 문서다.

사용 목적:

- main execution plan에서 sub-plan으로 바로 이동
- task 번호와 파일명을 안정적으로 매핑
- 이전/다음 task 흐름을 한눈에 확인
- 실행 시 어떤 상세 문서를 먼저 읽어야 하는지 빠르게 판단
- `/start-work`를 task 단위로 사용할 때 직접 진입점 역할 수행

---

## 읽는 순서

1. `.sisyphus/plans/phase1-execution-plan.md`
2. 이 문서
3. 해당 task의 sub-plan 문서

---

## Task -> Sub-plan 매핑

| Task | 상태 | 제목 | Sub-plan 파일 |
|------|------|------|---------------|
| 1 | 🟢 Done | Foundation, Runtime, Swagger/OpenAPI Bootstrap | `./phase1-subplans/phase1-task-01-foundation-runtime-swagger.md` |
| 2 | 🟢 Done | Auth and Role Skeleton | `./phase1-subplans/phase1-task-02-auth-role-skeleton.md` |
| 3 | 🟢 Done | Requester Business Approval Gate | `./phase1-subplans/phase1-task-03-requester-approval-gate.md` |
| 4 | 🟡 Partial | Supplier Profile and Verification Submission | `./phase1-subplans/phase1-task-04-supplier-verification.md` |
| 5 | 🟡 Partial | Admin Review Queue and Decision Actions | `./phase1-subplans/phase1-task-05-admin-review-queue.md` |
| 6 | 🟡 Partial | Supplier Discovery and Read Models | `./phase1-subplans/phase1-task-06-supplier-discovery.md` |
| 7 | 🟢 Done | Request Lifecycle and Targeting | `./phase1-subplans/phase1-task-07-request-lifecycle.md` |
| 8 | 🟢 Done | Quote Lifecycle and Comparison | `./phase1-subplans/phase1-task-08-quote-lifecycle.md` |
| 9 | 🔴 Not Started | Message Threads, Attachments, Read State | `./phase1-subplans/phase1-task-09-message-threads.md` |
| 10 | 🔴 Not Started | Contact-Share Consent | `./phase1-subplans/phase1-task-10-contact-share.md` |
| 11 | 🔴 Not Started | Admin Notices, Stats and Stabilization | `./phase1-subplans/phase1-task-11-admin-notices-stabilization.md` |

---

## 연속 탐색용 순서

| 현재 Task | 이전 | 다음 |
|-----------|------|------|
| 1 | 없음 | 2 |
| 2 | 1 | 3 |
| 3 | 2 | 4 |
| 4 | 3 | 5 |
| 5 | 4 | 6 |
| 6 | 5 | 7 |
| 7 | 6 | 8 |
| 8 | 7 | 9 |
| 9 | 8 | 10 |
| 10 | 9 | 11 |
| 11 | 10 | 없음 |

---

## 사용 규칙

- 상위 우선순위는 항상 `phase1-execution-plan.md`다.
- sub-plan은 해당 task의 상세 체크리스트, 병렬 구조, 리스크, 산출물을 설명한다.
- main plan과 sub-plan이 충돌하면 main plan을 먼저 확인하고, 필요 시 두 문서를 함께 갱신한다.
- 실제 실행 시에는 해당 task의 sub-plan을 acceptance/evidence 기준과 함께 사용한다.
- 코드 리뷰와 완료 판정은 wave가 아니라 task 문서 기준으로 수행한다.
