# Task 01 - Foundation, Runtime, Swagger/OpenAPI Bootstrap

## 메인 Task 메타데이터

| 항목 | 값 |
|------|-----|
| **메인 Task ID** | 1 |
| **병렬 그룹** | Group A |
| **기간** | 3-4일 |
| **스토리 포인트** | 13 |
| **작업자** | Full-stack + DevOps |
| **우선순위** | P0 (Blocker) |
| **상태** | 계획 중 |
| **Can Parallel** | NO |
| **Blocks** | Task 2-11 |
| **Blocked By** | 없음 |

---

## 개요

Phase 1 구현의 기반을 다지는 첫 번째 task다. 프론트엔드/백엔드 워크스페이스 구조, 데이터베이스 연결, 인증 기반, Swagger/OpenAPI code-first 통합을 설정한다. 이 작업 없이는 어떤 후속 task 구현도 시작할 수 없다.

---

## SubTask 목록

### 1.1 프론트엔드 워크스페이스 설정

**작업자:** Frontend  
**예상 소요:** 1일

- [ ] Yarn 4.5.0 (Berry) + Yarn Workspaces 초기화
  - [ ] `.yarnrc.yml` 설정
  - [ ] Root `package.json` workspace 정의
- [ ] App skeleton 생성
  - [ ] `apps/main-site` - React + Vite + React Router
  - [ ] `apps/admin-site` - React + Vite + React Router
- [ ] Shared packages skeleton
  - [ ] `packages/ui` - 공통 UI 컴포넌트
  - [ ] `packages/types` - DTO/ViewModel 타입
  - [ ] `packages/utils` - API 클라이언트, 유틸리티
  - [ ] `packages/config` - 공통 설정

### 1.2 백엔드 Gradle 멀티모듈 설정

**작업자:** Backend  
**예상 소요:** 1일

- [ ] Root `settings.gradle.kts` 모듈 정의
  - [ ] `shared-core` - 공통 커널
  - [ ] `command-domain-*` 모듈 그룹
  - [ ] `query-model-*` 모듈 그룹
  - [ ] `projection` - 프로젝션 계층
  - [ ] `api-server` - 메인 API 서버
  - [ ] `admin-server` - 관리자 API 서버
- [ ] 공통 의존성 버전 관리 (`gradle/libs.versions.toml`)
- [ ] Base package `dev.riss.fsm` 구조 설정

### 1.3 데이터베이스 연결 및 설정

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] MariaDB/R2DBC Write Store 연결 설정
  - [ ] `application.yml` R2DBC 설정
  - [ ] Connection pool 설정
- [ ] MongoDB Read Store 연결 설정
  - [ ] MongoDB client 설정
  - [ ] Database/collection 네이밍 규칙
- [ ] Flyway/R2DBC migration 기반 설정 (선택)

### 1.4 JWT/Security Skeleton

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] Spring Security WebFlux 설정
  - [ ] Security filter chain 기본 구조
  - [ ] JWT authentication entry point
- [ ] JWT 토큰 유틸리티
  - [ ] Token 생성/검증
  - [ ] Claims 추출
- [ ] 공통 권한 처리 구조

### 1.5 공통 Response/Error Envelope

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] Success response envelope (`code`, `message`, `data`, `meta`)
- [ ] Error response envelope (`code`, `message`, `errors`, `traceId`)
- [ ] Global exception handler
- [ ] Validation error 변환 규칙
- [ ] HTTP status code 매핑 규칙

### 1.6 Swagger/OpenAPI Code-First Bootstrap

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] SpringDoc OpenAPI WebFlux 설정
  - [ ] `api-server` Swagger UI 경로 설정 (`/swagger-ui.html`)
  - [ ] `admin-server` Swagger UI 경로 설정 (`/swagger-ui.html`)
- [ ] 공통 API 문서 설정
  - [ ] Title, version, description
  - [ ] JWT Bearer auth scheme 정의
  - [ ] Global response code 정의
- [ ] Annotation 기반 문서화 기준 설정
  - [ ] `@Operation`, `@Schema` 사용 규칙
  - [ ] Code-first 원칙 문서화

### 1.7 Seed Data 및 Test Harness

**작업자:** Full-stack  
**예상 소요:** 0.5일

- [ ] 개발용 seed data 스크립트
  - [ ] Test 사용자 계정
  - [ ] Test 공급자 프로필
  - [ ] Test 의뢰 데이터
- [ ] Test harness 기본 구조
  - [ ] Backend: WebTestClient 기반 테스트 유틸
  - [ ] Frontend: MSW (Mock Service Worker) 설정
- [ ] 환경별 설정 분리 (local/dev)

---

## 인수 완료 조건 (Acceptance Criteria)

- [ ] `apps/main-site`와 `apps/admin-site`가 `yarn dev`로 실행 가능
- [ ] `api-server`와 `admin-server`가 `./gradlew bootRun`으로 실행 가능
- [ ] `/swagger-ui.html`에서 API 문서 확인 가능 (JWT auth scheme 포함)
- [ ] 공통 response envelope 구조가 모든 API 응답에 적용됨
- [ ] JWT 토큰 생성/검증이 정상 동작
- [ ] MariaDB와 MongoDB 연결이 정상 (health check 통과)
- [ ] Seed data가 개발 환경에 적용됨

---

## 병렬 작업 구조

```
Day 1: [Frontend workspace] || [Backend modules]
Day 2: [Database setup] + [JWT/Security] + [Envelope]
Day 3: [Swagger bootstrap] + [Seed data] + [Integration test]
```

**주의:** 이 Task는 병렬 실행 불가. Foundation이 완료되어야 Slice 구현 시작 가능.

---

## 의존성 매트릭스

| From | To | 관계 |
|------|-----|------|
| 1.3 DB 설정 | 1.4 JWT/Security | DB 연결 후 security context 저장소 확보 |
| 1.4 JWT | 1.5 Envelope | Auth error envelope 통합 |
| 1.5 Envelope | 1.6 Swagger | Response schema 정의 필요 |
| 1.6 Swagger | 1.7 Seed data | API contract 확정 후 seed 작성 |

---

## 리스크 및 완화 전략

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| Yarn Berry 마이그레이션 이슈 | High | Zero-install 설정 검증, `.pnp.cjs` 캐시 확인 |
| R2DBC 연결 풀 설정 오류 | High | MariaDB 최소 버전 확인, r2dbc-mariadb 드라이버 검증 |
| Swagger UI 버전 충돌 | Medium | SpringDoc 2.3.x 기준 고정, WebFlux 호환성 확인 |
| JWT 시크릿 키 관리 | Medium | 개발 환경용 키 분리, 프로덕션 배포 시 별도 관리 |

---

## 산출물 (Artifacts)

### 코드
- `frontend/` 워크스페이스 전체 구조
- `backend/` 멀티모듈 전체 구조
- `shared-core` 공통 응답/예외 타입
- Swagger/OpenAPI configuration 클래스

### 문서
- 로컬 개발 환경 실행 가이드 (`README.md`)
- Swagger UI 접속 경로 명시

### 설정
- `.env.example` (frontend)
- `application-local.yml` (backend)

---

## Commit

```
chore(plan): foundation and swagger bootstrap 정렬

- Frontend workspace with Yarn 4.5.0 + workspaces
- Backend Gradle multi-module structure
- MariaDB/MongoDB connection setup
- JWT/Security skeleton
- Common success/error envelope
- Swagger/OpenAPI code-first bootstrap
- Dev seed data and test harness baseline
```

---

**이전 Task**: 없음
**다음 Task**: [Task 2: Auth and Role Skeleton](./phase1-task-02-auth-role-skeleton.md)
