# @fsm/main-site

FSM 일반 사용자용 프론트엔드 (구매사 / 공급사). Vite dev 서버는 **5173** 포트.

- 전체 스택 기동: [LOCAL-RUN-GUIDE.ko.md](../../../LOCAL-RUN-GUIDE.ko.md)
- 프론트 공통 사항: [frontend/README.md](../../README.md)

---

## 실행

```bash
yarn workspace @fsm/main-site dev          # Vite dev 서버 (5173)
yarn workspace @fsm/main-site build        # tsc + vite build
yarn workspace @fsm/main-site test         # vitest
yarn workspace @fsm/main-site type-check   # tsc --noEmit
yarn workspace @fsm/main-site e2e          # Playwright (8080/8081 백엔드 필요)
yarn workspace @fsm/main-site e2e:install  # 최초 1회 브라우저 설치
```

백엔드 (api-server 8080) 가 떠 있어야 실제 페이지 동작 확인 가능. Vite `vite.config.ts` 의 proxy 가 `/api` 를 8080 으로 same-origin 프록시함.

---

## 주요 라우트

로그인 / 회원가입:

- `/login`, `/signup`

구매사 (buyer) 흐름:

- `/dashboard` — 역할별 대시보드
- `/requests` — 내 요청 목록
- `/requests/new` — 새 요청 작성
- `/requests/:requestId` — 요청 상세
- `/requests/:requestId/quotes` — 견적 비교

공급사 (supplier) 흐름:

- `/supplier/profile` — 공급사 프로필 설정 / 심사 대기
- `/supplier/requests` — 공급사가 볼 수 있는 요청 피드
- `/supplier/requests/:requestId` — 요청 상세 (공급사 뷰)
- `/supplier/quotes` — 내가 제출한 견적
- `/quotes/create` — 새 견적 작성

공통:

- `/` — 홈
- `/suppliers`, `/suppliers/:supplierId` — 공급사 탐색
- `/business-profile` — 사업자 프로필
- `/threads`, `/threads/:threadId` — 1:1 스레드
- `/notices`, `/notices/:noticeId` — 공지

정확한 요소/권한 분기는 `src/App.tsx` 참조. Role-guard 는 `PrivateRoute` / `RoleGuard` 구현.

---

## 테스트 계정

시드 계정 비밀번호·역할 매핑은 `.sisyphus/session-handoff-*.md` / `LOCAL-RUN-GUIDE.ko.md` 참조. 레포에 평문 비번은 싣지 않음.

---

## 구조 요점

```
src/
├── app/                    # 앱 진입 (main.tsx / App.tsx / routes)
├── features/               # 도메인별 슬라이스
│   ├── auth/
│   ├── request-management/
│   ├── supplier-quotes/
│   ├── supplier-requests/
│   ├── threads/
│   ├── notices/
│   └── ...
├── shared/                 # 공용 컴포넌트 (AsyncBoundary 등)
├── i18n/                   # 네임스페이스별 locale JSON
└── types/
```

각 feature 슬라이스는 `api/`, `hooks/`, `pages/`, `components/` 구성. TanStack Query key 는 feature 별 `query-keys.ts` factory 로 관리.
