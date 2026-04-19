# @fsm/admin-site

FSM 관리자용 프론트엔드. Vite dev 서버는 **5174** 포트, 백엔드는 **admin-server 8081** 을 바라봄.

- 전체 스택 기동: [LOCAL-RUN-GUIDE.ko.md](../../../LOCAL-RUN-GUIDE.ko.md)
- 프론트 공통 사항: [frontend/README.md](../../README.md)

---

## 실행

```bash
yarn workspace @fsm/admin-site dev          # Vite dev 서버 (5174)
yarn workspace @fsm/admin-site build
yarn workspace @fsm/admin-site test         # vitest
yarn workspace @fsm/admin-site type-check
```

admin-server (8081) 가 떠 있지 않으면 로그인 불가. api-server (8080) 와 별도 프로세스이며 DB 스키마도 분리되어 있음. 둘 다 띄우는 방법은 `LOCAL-RUN-GUIDE.ko.md §7` 참조.

---

## 관리자 진입

- `/login` — 관리자 전용 로그인 화면. 여기서 `role=ADMIN` 이 아닌 계정은 서버단에서 403 으로 차단됨 (`c1a0358` 커밋 참조).
- 인증 후:
  - `/` — 홈 (관리자용 요약 화면)
  - `/reviews` — 사업자/공급사 검수 큐
  - `/reviews/:reviewId` — 검수 상세
  - `/notices` — 공지 관리 (CRUD, 파일 업로드)
  - `/stats` — 통계 대시보드

---

## 관리자 계정

시드 관리자 계정·비번은 `.sisyphus/session-handoff-*.md` 의 "테스트 계정" 항목을 참조. 레포에 평문 비번은 싣지 않음. 새 관리자 계정은 `backend/scripts/.../seed_*.sql` 에서 추가하거나 DB 직조로 생성.

일반 사용자 계정으로 `/login` 을 시도하면 로그인 자체가 실패함 (관리자 서버 정책).

---

## 구조 요점

```
src/
├── main.tsx / App.tsx
├── features/
│   ├── auth/
│   ├── reviews/
│   ├── notices/
│   └── stats/
├── shared/
├── i18n/
└── types/
```

main-site 와 동일한 query-key factory / feature slice 규약을 사용. 다만 `AsyncBoundary` 는 아직 admin-site 로 확장되지 않음 (`.sisyphus/open-items.md` FE-1).
