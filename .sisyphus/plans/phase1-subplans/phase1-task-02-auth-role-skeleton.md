# Task 02 - Auth and Role Skeleton

## 메인 Task 메타데이터

| 항목 | 값 |
|------|-----|
| **메인 Task ID** | 2 |
| **병렬 그룹** | Group B |
| **기간** | 2-3일 |
| **스토리 포인트** | 8 |
| **작업자** | Full-stack |
| **우선순위** | P0 |
| **상태** | 🔴 Not Started |
| **Can Parallel** | YES |
| **Blocks** | Task 6, 8 |
| **Blocked By** | Task 1 |

---

## 개요

사용자 인증과 기본 역할 시스템의 뼈대를 구현한다. 회원가입, 로그인, 내 정보 조회, JWT 발급 및 검증, 역할 기반 접근 제어를 포함한다. 이 Task는 인증된 사용자 기반을 마련하여 모든 이후 기능 slice가 인증 context 위에서 동작하도록 한다.

---

## 현재 진행 상태

- 메인 Task 상태: 🔴 Not Started
- 메모: 선행 task 완료 후 시작 예정.

| SubTask | 상태 | 메모 |
|---------|------|------|
| 2.1 | 🔴 Not Started | 미착수 |
| 2.2 | 🔴 Not Started | 미착수 |
| 2.3 | 🔴 Not Started | 미착수 |
| 2.4 | 🔴 Not Started | 미착수 |
| 2.5 | 🔴 Not Started | 미착수 |
| 2.6 | 🔴 Not Started | 미착수 |

---

## SubTask 목록

### 🔴 SubTask 2.1: 회원가입 (Signup)

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] Command: `CreateUserAccount`
  - [ ] 이메일 중복 검증
  - [ ] 비밀번호 해싱 (BCrypt)
  - [ ] 역할 저장 (`requester` | `supplier`)
- [ ] API: `POST /api/auth/signup`
  - [ ] Validation: email 형식, password 규칙 (8-100자, 영문/숫자/특수문자)
  - [ ] Swagger annotation 적용
- [ ] Test: 중복 이메일, 비밀번호 정책 위반 케이스

### 🔴 SubTask 2.2: 로그인 (Login)

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] Command: `AuthenticateUser`
  - [ ] 이메일/비밀번호 검증
  - [ ] JWT access token + refresh token 발급
- [ ] API: `POST /api/auth/login`
  - [ ] Swagger annotation 적용
  - [ ] Response: `accessToken`, `refreshToken`, `expiresIn`, `user`
- [ ] Frontend: Login form
  - [ ] `main-site` 로그인 화면
  - [ ] TanStack Query mutation 설정
  - [ ] Token storage (httpOnly cookie 권장)

### 🔴 SubTask 2.3: 내 정보 조회 (Me)

**작업자:** Backend + Frontend  
**예상 소요:** 0.5일

- [ ] API: `GET /api/me`
  - [ ] JWT에서 userId 추출
  - [ ] UserAccount + BusinessProfile/SupplierProfile 조인
  - [ ] 역할 및 승인 상태 포함
- [ ] Frontend: Auth context
  - [ ] Zustand auth store
  - [ ] `useMe()` hook
  - [ ] 로그인 상태 persistence

### 🔴 SubTask 2.4: JWT 인증 필터

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] `AuthenticationWebFilter` 구현
  - [ ] Authorization header 파싱
  - [ ] JWT 검증 및 claims 추출
  - [ ] Security context 설정
- [ ] 인증 예외 처리
  - [ ] 토큰 만료 (401)
  - [ ] 잘못된 토큰 (401)
  - [ ] 권한 없음 (403)
- [ ] Swagger: `@SecurityRequirement(name = "bearerAuth")` 적용

### 🔴 SubTask 2.5: 역할 기반 접근 제어 (RBAC)

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] Role hierarchy 정의
  - [ ] `requester` - 의뢰자
  - [ ] `supplier` - 공급자
  - [ ] `admin` - 관리자
- [ ] Method security 설정
  - [ ] `@PreAuthorize("hasRole('requester')")` 예시 적용
  - [ ] Custom permission evaluator (필요시)
- [ ] API별 권한 매핑 문서화

### 🔴 SubTask 2.6: 인증 관련 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [ ] `main-site` 로그인 페이지
  - [ ] 이메일/비밀번호 입력
  - [ ] 오류 메시지 표시
- [ ] `main-site` 회원가입 페이지
  - [ ] 역할 선택 (requester/supplier)
  - [ ] 사업자명 입력
- [ ] Protected route guard
  - [ ] React Router route protector
  - [ ] 인증되지 않은 사용자 리다이렉트

---

## 인수 완료 조건 (Acceptance Criteria)

- [ ] 회원가입 시 이메일/비밀번호/역할로 계정 생성 가능
- [ ] 로그인 시 JWT 토큰 발급 및 이후 API 호출에 사용 가능
- [ ] `GET /api/me`로 현재 로그인한 사용자 정보 조회 가능
- [ ] 역할별 접근 제어가 동작 (requester/supplier/admin)
- [ ] Swagger UI에서 인증 버튼으로 JWT 토큰 설정 가능
- [ ] Frontend에서 로그인/로그아웃 플로우 정상 동작

---

## 병렬 작업 구조

```
Backend 작업자:  [2.1 Signup] -> [2.2 Login] -> [2.4 JWT Filter]
                         -> [2.5 RBAC]
Frontend 작업자: [2.6 UI setup] + [2.3 Me integration]
```

**통합 지점:** Backend API 완료 후 Frontend 연동 테스트

---

## 의존성 매트릭스

| From | To | 관계 |
|------|-----|------|
| Task 1 | Task 2 | Foundation 완료 필요 |
| 2.1 Signup | 2.2 Login | 사용자 생성 후 로그인 테스트 필요 |
| 2.2 Login | 2.4 JWT Filter | 토큰 발급 후 검증 로직 필요 |
| 2.4 JWT Filter | 2.3 Me | 인증 컨텍스트에서 사용자 조회 |
| Task 2 | Task 6 | Request lifecycle에 인증 필요 |
| Task 2 | Task 8 | Quote 제출에 인증 필요 |

---

## 리스크 및 완화 전략

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| JWT 시크릿 키 노출 | Critical | 환경변수 분리, local/dev/prod 키 분리 |
| 비밀번호 해싱 성능 | Medium | BCrypt strength 조정 (10-12 rounds) |
| 토큰 만료 정책 | Medium | Access: 1시간, Refresh: 7일 기준 설정 |
| 역할 확장성 | Low | Role enum으로 관리, string 비즈니스 키 사용 |

---

## 산출물 (Artifacts)

### Backend
- `command-domain-user`: UserAccount aggregate, commands
- `query-model-user`: User read model
- `api-server`: Auth controller, JWT filter, security config
- Swagger: `/api/auth/**` endpoints documented

### Frontend
- `apps/main-site`: Login page, Signup page
- `packages/utils`: API client with auth header
- `packages/types`: Auth DTO types

### 테스트
- Backend: Auth controller unit tests, JWT filter tests
- Frontend: Auth flow e2e tests (happy path + denial)

---

## Commit

```
feat(plan): AUTH-001 실행 계획 고정

- Signup with email/password/role
- Login with JWT token issuance
- /api/me endpoint with auth context
- JWT authentication filter
- RBAC skeleton (requester/supplier/admin)
- Swagger auth scheme documentation
```

---

**이전 Task**: [Task 1: Foundation, Runtime, Swagger/OpenAPI Bootstrap](./phase1-task-01-foundation-runtime-swagger.md)
**다음 Task**: [Task 3: Requester Business Approval Gate](./phase1-task-03-requester-approval-gate.md)
