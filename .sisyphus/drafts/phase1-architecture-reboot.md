# Phase 1 Architecture Reboot (Historical Record)

> 상태: Historical Decision Record
> 목적: active baseline이 잠기기 전의 설계 재정의 과정과 결정 이력을 보존
> 현재 기준: `.sisyphus/drafts/phase1-active-baseline.md`

## Requirements (confirmed)
- task 운영 방식: TaskMaster 없이 `.sisyphus/plans/`와 `.sisyphus/drafts/`만 사용
- architecture 문서 체계: `system-architecture.md`, `data-model.md`, `api-spec.md` 3개로 단순화
- package base: `dev.riss.fsm`
- backend 방향: MSA가 아니라 `CQRS + DDD + Reactive WebFlux` 기반 아키텍처로 설계
- frontend 구조: 단일 앱이 아니라 메인 서비스 사이트와 관리자 사이트 분리
- backend 구조: 메인 서버(`api 서버`)와 어드민 서버(`admin 서버`) 분리
- backend 설계 방향: CQRS 전제
- command 모델: entity 클래스 중심, RDB 사용
- query 모델: 같은 도메인이라도 별도 query/read 클래스 사용, NoSQL(MongoDB 계열) 사용
- guide 문서 필요: 프론트 관점, 디자이너 관점, 백엔드 관점에서 보여주고 피드백할 수 있는 각 가이드 문서 필요
- 협업 방식: 처음부터 다시 설계하며, 필요한 질문은 하나씩 묻기

## Technical Decisions
- planning mode 유지: 지금은 구현이 아니라 decision-complete 설계 재정의 단계
- local authority chain 우선: 기존 `.sisyphus` 문서와 루트 guide 3개를 함께 읽고 충돌 지점을 다시 정리
- frontend app split: Phase 1은 `main-site + admin-site` 2개 앱으로 고정
- requester / supplier 분리 방식: 별도 앱이 아니라 `main-site` 내부 역할/IA 분리로 처리
- frontend repo shape: `frontend/`는 workspace 기반으로 설계
- frontend shared packages: `ui`, `types`, `utils`, `config` 공통 패키지를 둔다
- frontend framework/runtime: `React + Vite + React Router`로 고정
- frontend package manager: `Yarn Berry + Yarn Workspaces`로 고정
- frontend workspace count baseline: 현재 합의 구조 기준 `apps/main-site`, `apps/admin-site`, `packages/ui`, `packages/types`, `packages/utils`, `packages/config`의 6개 워크스페이스
- frontend state split: server state는 `TanStack Query`, client state는 `Zustand`를 기본값으로 사용
- frontend styling stack: `Emotion` + `Radix UI + Tailwind` 조합으로 고정
- frontend font baseline: `Noto Sans JP`
- frontend i18n baseline: `i18next`
- frontend animation baseline: `Lottie-web`
- frontend network/util baseline: `axios`, `dayjs`, `lodash-es`
- backend repo shape: 하나의 `backend/` 아래 Gradle 멀티모듈 구조를 유지
- backend runtime split: `api-server`와 `admin-server` 두 서버로 분리
- backend runtime style: `Reactive WebFlux`로 고정
- write persistence access: `JPA/Hibernate` 대신 `R2DBC`를 기본값으로 사용
- CQRS depth: strict split으로 고정
- backend module taxonomy: `shared-core`, `command-domain-*`, `query-model-*`, `projection`, `api-server`, `admin-server` 구조를 기본값으로 사용
- command side: write entity / aggregate / command handler 중심으로 설계
- query side: read model / projection / query handler 중심으로 별도 클래스와 모듈로 설계
- read synchronization: RDB write 변경을 projection 계층이 MongoDB read model로 동기화하는 구조를 기본값으로 사용
- frontend stack locked for now: TypeScript 5.3.x, React 18.2+, Vite 5.1+, Yarn 4.5.0 (Berry), Yarn Workspaces, React Router 6.22+, TanStack Query 5.18+, Zustand 4.5+, Emotion, Radix UI + Tailwind, Noto Sans JP, i18next, Lottie-web, axios 1.6.7, dayjs 1.11+, lodash-es 4.17+
- API response baseline: body 안의 `code` 필드로 애플리케이션 결과를 표현하고, `code=100`을 정상(success) 기준으로 사용

## Research Findings
- `.sisyphus/drafts/1st-phase-questionnaire-v2.md`: 별도 관리자 웹사이트, CQRS, MariaDB/MySQL + MongoDB 방향이 이미 남아 있음
- `.sisyphus/archive/design/phase1/phase1-api-and-validation-spec.md`: `/api/admin/*` namespace가 이미 설계되어 있었음
- `backend-guide.md`: `api` / `admin` 서비스 분리 + CQRS + MariaDB write / MongoDB read 패턴을 강하게 제안함
- `frontend-guide.md`: 다중 앱(workspaces) 구조와 `admin-app` 분리를 강하게 제안함
- `design-system.md`: 관리자 대시보드를 별도 surface로 다룰 수 있는 디자인 언어와 레이아웃 철학을 제공함
- external validation: `WebFlux + JPA/Hibernate` 조합은 reactive runtime과 충돌 가능성이 높아, `R2DBC`로 전환하거나 `Spring MVC + Virtual Threads`로 재선택하는 질문이 필요함
- external validation: frontend stack은 대체로 성립하지만 `Emotion + Tailwind` 조합은 역할 분담 규칙을 명확히 적어야 함

## Open Questions
- API transport contract: 인증/인가/시스템 오류까지 모두 `HTTP 200 + body.code`로 통일할지, 아니면 business/application 오류만 body.code로 다루고 transport/auth 오류는 HTTP status를 유지할지 확인 필요

## Document Restructure
- `system-architecture.md`: repo shape, app/server split, package namespace, CQRS 모듈 구조, projection 흐름, guide 문서 체계
- `data-model.md`: command/write entity, aggregate, RDB schema 방향, query/read model, Mongo projection 모델
- `api-spec.md`: api-server/admin-server 경계, endpoint 그룹, auth/role boundary, request-response-validation rules

## Scope Boundaries
- INCLUDE: Phase 1 architecture 재정의, repo shape, app/server split, package naming, CQRS 구조, guide 문서 체계
- EXCLUDE: 실제 코드 구현, 인프라 배포 세부, 세부 화면 디자인 확정, DB 스키마 상세 구현
