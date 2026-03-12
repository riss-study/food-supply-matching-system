# Phase 1 개발 진입 가이드

> 버전: v1.0
> 작성일: 2026-03-12
> 상태: Active
> 목적: 실제 코딩을 시작하기 전에 개발자가 가장 먼저 열어야 하는 진입 가이드
> 성격: 실행 안내 문서
> 상위 기준: `.sisyphus/plans/document-structure-plan.md`

---

## 1. 이 문서는 언제 쓰나

이 문서는 아래 상황에서 가장 먼저 본다.

- 구현을 시작하려고 할 때
- 새 작업자가 프로젝트에 처음 들어올 때
- 어떤 문서가 기준인지 헷갈릴 때
- 슬라이스 순서와 QA 규칙을 빠르게 다시 확인하고 싶을 때

이 문서는 `입구 문서`다.

즉, 모든 세부 내용을 직접 다 설명하는 문서가 아니라,
**어떤 문서를 어떤 순서로 봐야 하는지**와 **실행 시 절대 어기면 안 되는 규칙**을 안내하는 문서다.

---

## 2. 이 문서가 하지 않는 일

이 문서는 아래 내용을 새로 정의하지 않는다.

- MVP 범위 재정의
- PRD 기능 상세 재작성
- 상태 모델/권한 모델 재작성
- API 스펙 재작성
- 데이터 모델 재작성
- 실제 프론트엔드/백엔드 코드 규칙 정의

위 내용은 이미 다른 기준 문서에 있다.

---

## 3. 현재 워크스페이스 상태

현재 워크스페이스는 **문서 중심 상태**다.

- 제품용 `src/` 없음
- 제품용 `package.json` 없음
- 제품용 `build.gradle`, `pom.xml` 없음
- 즉, 아직 실제 앱 코드베이스는 없다

그래서 지금 단계는 아래 순서로 가야 한다.

1. 기준 문서 해석 통일
2. 실행 진입 규칙 통일
3. 코딩 전 TASK 구조 작성
4. 프로젝트 스캐폴딩
5. 실제 구현 시작

---

## 4. 문서 우선순위

문서가 충돌하면 아래 순서를 따른다.

1. `.sisyphus/plans/document-structure-plan.md`
2. `.sisyphus/drafts/1st-phase-requirements-final.md`
3. `.sisyphus/drafts/PRD-v1.0-MVP-Korean.md`
4. `.sisyphus/design/phase1-design-baseline.md`
5. `.sisyphus/design/phase1-information-architecture-and-flows.md`
6. `.sisyphus/design/phase1-permissions-and-state-model.md`
7. `.sisyphus/design/phase1-domain-and-data-model.md`
8. `.sisyphus/design/phase1-api-and-validation-spec.md`
9. `.sisyphus/design/phase1-acceptance-scenarios-and-backlog.md`
10. `.sisyphus/drafts/phase1-policy-closure-log.md`
11. `.sisyphus/drafts/phase1-execution-foundation.md`
12. `.sisyphus/plans/phase1-implementation-breakdown-plan.md`

주의:

- 이 문서는 위 문서를 대체하지 않는다.
- 이 문서는 위 문서를 **찾아가기 쉽게 묶는 역할**만 한다.

---

## 5. 먼저 읽는 순서

### 1차 빠른 이해

아래 4개만 먼저 읽으면 전체 윤곽을 잡을 수 있다.

1. `.sisyphus/drafts/1st-phase-requirements-final.md`
2. `.sisyphus/drafts/PRD-v1.0-MVP-Korean.md`
3. `.sisyphus/design/phase1-design-baseline.md`
4. `.sisyphus/drafts/phase1-policy-closure-log.md`

### 2차 구현 준비

실제 구현 전에는 아래까지 읽어야 한다.

5. `.sisyphus/design/phase1-information-architecture-and-flows.md`
6. `.sisyphus/design/phase1-permissions-and-state-model.md`
7. `.sisyphus/design/phase1-domain-and-data-model.md`
8. `.sisyphus/design/phase1-api-and-validation-spec.md`
9. `.sisyphus/design/phase1-acceptance-scenarios-and-backlog.md`
10. `.sisyphus/plans/phase1-implementation-breakdown-plan.md`

### 3차 실행 확인

11. `.sisyphus/drafts/phase1-execution-foundation.md`

---

## 6. 지금 고정된 핵심 규칙

구현자가 다시 판단하면 안 되는 핵심 규칙만 요약한다.

- 요청자는 가입 가능하지만 사업자 승인 전에는 의뢰 등록/수정 불가
- 공급자는 승인 상태여야 검색 노출 및 견적 참여 가능
- 메시지 스레드는 `첫 견적 제출` 또는 `요청자 상담 시작`으로 생성 가능
- 같은 요청자-공급자-의뢰 조합에는 활성 스레드 1개만 허용
- 견적 PATCH는 `submitted` 상태에서만 가능하고 수정 이력을 남겨야 함
- 연락처 공유는 revoke 가능, 이후 retry 가능
- 관리자 `hold` / `reject` / `resubmission` 의미는 정책 문서 기준으로 고정

세부 문구와 상태 전이는 반드시 `phase1-policy-closure-log.md`와 `phase1-permissions-and-state-model.md`를 따른다.

---

## 7. 코딩 시작 준비 완료 조건

아래 조건이 모두 맞아야 `코딩 시작 가능`으로 본다.

- 기준 요구사항/PRD/설계 문서가 같은 규칙을 말한다
- 정책 고정 문서가 존재한다
- 실행 기반 문서가 현재 워크스페이스 현실을 반영한다
- 구현할 TASK 구조가 준비되어 있다
- 실제 프로젝트 스캐폴딩 대상이 정리되어 있다

현재 판단:

- 정책 준비: 완료
- 설계 준비: 완료에 가까움
- 실제 코드베이스 준비: 미완료

즉, 지금은 `바로 기능 코딩`이 아니라 `코딩 전 TASK 구조`와 `프로젝트 스캐폴딩 계획`이 먼저다.

---

## 8. 실행 순서

현재 구현 순서는 아래를 따른다.

### Wave 0

- 실행 기반 확인
- 정책 고정 반영 확인
- 코딩 전 TASK 구조 준비

### Slice Order

1. auth / role / requester onboarding
2. supplier profile / verification submission
3. admin review / supplier state decisions
4. supplier discovery / search / detail read models
5. request lifecycle / targeting
6. quote submission / selection / comparison
7. message threads / attachments / read state
8. contact-share consent
9. notices / admin summary / basic stats

정확한 파동/의존성/QA 시나리오는 반드시 `phase1-implementation-breakdown-plan.md`를 따른다.

---

## 9. 슬라이스별로 반드시 같이 보는 문서

| 작업 종류 | 반드시 같이 볼 문서 |
|-----------|----------------------|
| 인증/권한 | `phase1-permissions-and-state-model.md`, `phase1-api-and-validation-spec.md` |
| 의뢰/견적 | `PRD-v1.0-MVP-Korean.md`, `phase1-information-architecture-and-flows.md`, `phase1-api-and-validation-spec.md` |
| 메시지/연락처 공유 | `phase1-policy-closure-log.md`, `phase1-permissions-and-state-model.md`, `phase1-information-architecture-and-flows.md` |
| 검색/리드모델 | `phase1-domain-and-data-model.md`, `phase1-api-and-validation-spec.md` |
| 관리자 검수 | `phase1-policy-closure-log.md`, `phase1-permissions-and-state-model.md`, `PRD-v1.0-MVP-Korean.md` |
| QA | `phase1-acceptance-scenarios-and-backlog.md`, `phase1-implementation-breakdown-plan.md` |

---

## 10. QA / Evidence / Commit 규칙

### QA

- 구현과 테스트는 분리하지 않는다
- 각 슬라이스는 happy path와 denial path를 같이 가져야 한다
- vague한 `잘 동작하는지 확인` 표현은 금지한다

### Evidence

- evidence 경로 규칙은 `.sisyphus/evidence/task-{N}-{slug}.{ext}`를 따른다
- 검증 결과는 task 단위로 남긴다

### Commit

- 한 커밋에는 하나의 coherent slice만 담는다
- 서로 먼 슬라이스를 한 번에 섞지 않는다
- 정책/설계 기준이 바뀌면 관련 문서를 같은 커밋에서 같이 수정해야 한다
- 앞으로 커밋 메시지는 **prefix + 한글 설명** 형식을 기본으로 한다

권장 prefix:

- `feat`: 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 작성/수정
- `design`: 설계 문서/구조/흐름 변경
- `refactor`: 동작 변화 없는 구조 개선
- `test`: 테스트 추가/수정
- `chore`: 설정, 도구, 유지보수 작업

예시:

- `feat: 요청자 사업자 승인 게이트 추가`
- `docs: 개발 진입 가이드 추가`
- `design: 메시지 스레드 생성 규칙 반영`
- `chore: Task Master MCP 설정 추가`

세부 commit 전략은 `phase1-implementation-breakdown-plan.md`를 따른다.

---

## 11. 문서 동기화 규칙

어떤 규칙이 바뀌면 아래를 같이 본다.

- 요구사항 문서
- 한글 PRD
- 영문/미러 PRD
- 설계 문서
- 정책 고정 문서
- 구현 분해 계획서

원칙:

- 이 entry guide는 최종 진실의 원천이 아니다
- 기준 문서가 바뀌면 이 문서는 그 변경을 안내하도록 갱신된다
- 이 문서에서만 새 규칙을 만들면 안 된다

---

## 12. 이 문서를 보고도 바로 판단하면 안 되는 것

아래는 이 문서만 보고 구현자가 독자적으로 결정하면 안 된다.

- 상태 전이 세부 로직
- API 요청/응답 세부 계약
- DB/리드모델 구조 세부
- 관리자 검수 문구 세부
- 연락처 공유 revoke/retry 세부 처리

이런 항목은 반드시 원문 설계 문서를 다시 열어 확인해야 한다.

---

## 13. 앞으로 언제 가이드를 분리하나

지금은 단일 entry guide만 유지한다.

아래 조건이 생기면 나중에 분리한다.

- 실제 프론트엔드/백엔드 프로젝트가 생성됨
- 실행/빌드/테스트 명령이 실제로 확정됨
- 여러 명 또는 여러 에이전트가 병렬 구현 시작
- 반복적으로 백엔드/프론트/디자인 핸드오프 혼선이 생김

그때는 아래처럼 분리할 수 있다.

- backend development guide
- frontend development guide
- design handoff guide
- setup / runbook guide

하지만 지금은 아직 이 단계가 아니다.

---

## 14. 지금 다음으로 할 일

현재 이 문서를 본 다음 가장 자연스러운 다음 작업은 아래다.

1. 코딩 전 TASK 문서 작성
2. 프로젝트 스캐폴딩 계획 고정
3. 실제 앱 코드베이스 생성 준비

즉, 이 문서는 `코딩 시작 버튼`이 아니라 `코딩 전 정렬 문서`다.
