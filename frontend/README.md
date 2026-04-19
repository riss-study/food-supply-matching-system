# Frontend (yarn 4 workspaces)

React + TypeScript + Vite 모노레포. main-site (사용자) 와 admin-site (관리자) 두 앱을 포함.

자세한 전체 스택 기동 절차는 루트의 [LOCAL-RUN-GUIDE.ko.md](../LOCAL-RUN-GUIDE.ko.md) 참고. 이 README 는 프론트 워크스페이스 범위만 다룸.

---

## 워크스페이스 구조

```
frontend/
├── apps/
│   ├── main-site/      # 일반 사용자 (구매사/공급사) — 포트 5173
│   └── admin-site/     # 관리자 — 포트 5174
└── packages/
    ├── config/         # 공용 설정
    ├── types/          # 공용 TS 타입
    ├── ui/             # 공용 CSS/스타일 (React 미포함)
    └── utils/          # 공용 유틸 (API base URL 해석 포함)
```

apps 는 React 컴포넌트를 쓰고, packages 는 아직 비-React 레벨 (types/utils/config/css) 만 공유. `packages/ui` 를 React 컴포넌트 공유로 승격할지는 `.sisyphus/open-items.md` FE-3 참조.

---

## 사전 준비

- Node 20.x (레포는 `frontend/.nvmrc` 존재)
- Yarn 4.5 (corepack 권장)
- Backend 서버 (api-server 8080, admin-server 8081) 가 돌아야 실제 동작 확인 가능. 백엔드 기동은 [LOCAL-RUN-GUIDE.ko.md §7](../LOCAL-RUN-GUIDE.ko.md#7-backend-서버-실행) 참조.

```bash
corepack enable
corepack prepare yarn@4.5.0 --activate
```

---

## 환경변수

각 앱은 자기 폴더의 `.env.local` 을 읽음. 비어 있으면 Vite dev proxy + 코드 기본값 (`http://localhost:8080`, `http://localhost:8081`) 으로 동작.

| 키 | 용도 | 기본값 |
|---|---|---|
| `VITE_API_BASE_URL` | api-server base URL | `http://localhost:8080` |
| `VITE_ADMIN_API_BASE_URL` | admin-server base URL | `http://localhost:8081` |

로컬에서 Vite 의 same-origin proxy 를 쓰려면 **비워두는 게 맞음** (`frontend/.env.example` 과 동일). 공인 IP / 원격 백엔드로 쏠 때만 값을 채움.

---

## 자주 쓰는 명령

루트에서 모든 워크스페이스 대상:

```bash
yarn install                # 의존성 설치
yarn dev:main-site          # main-site 개발 서버
yarn dev:admin-site         # admin-site 개발 서버
yarn build                  # 전 워크스페이스 빌드
yarn test                   # 전 워크스페이스 vitest
yarn type-check             # 전 워크스페이스 tsc --noEmit
yarn e2e                    # main-site Playwright e2e
yarn e2e:install            # Playwright 브라우저 설치
```

개별 앱 명령은 `yarn workspace @fsm/main-site <script>` 또는 `yarn workspace @fsm/admin-site <script>` 형태.

---

## 테스트 / 타입체크

```bash
yarn workspace @fsm/main-site test
yarn workspace @fsm/admin-site test
yarn workspace @fsm/main-site type-check
yarn workspace @fsm/admin-site type-check
```

- Vitest + @testing-library/react + MSW 사용
- e2e 는 main-site 쪽에만 존재 (`apps/main-site/e2e/`)
- React Router v7 future flag 는 opt-in 됨 (콘솔 warning 없음)

---

## 빌드 / 배포

현재 공식 배포 파이프라인은 없음. 각 앱은 `vite build` 로 `dist/` 생성. 정적 호스팅이면 그대로 업로드 가능.

---

## 참고 문서

- [LOCAL-RUN-GUIDE.ko.md](../LOCAL-RUN-GUIDE.ko.md) — 전체 스택 (DB/backend/frontend) 로컬 기동
- [docs/REFACTORING-GUIDELINES.ko.md](../docs/REFACTORING-GUIDELINES.ko.md) — 리팩토링 지침 (§2 프론트 전용)
- [apps/main-site/README.md](./apps/main-site/README.md)
- [apps/admin-site/README.md](./apps/admin-site/README.md)
