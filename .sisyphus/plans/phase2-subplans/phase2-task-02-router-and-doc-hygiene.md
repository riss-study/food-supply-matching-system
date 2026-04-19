# Phase 2 Task 02 - Router 및 문서 정리

## 메인 Task 메타데이터

| 항목 | 값 |
|------|-----|
| **메인 Task ID** | P2-02 |
| **Wave** | 1 (Launch Readiness + Delivery Baseline) |
| **우선순위** | P0 |
| **기간** | 1-1.5일 |
| **스토리 포인트** | 3 |
| **작업자** | Frontend |
| **상태** | 🟢 Done (2026-04-19) |
| **Can Parallel** | YES (P2-01과 병렬 가능) |
| **Blocks** | 없음 (cleanup 성격) |
| **Blocked By** | 없음 |

---

## 개요

Phase 1 종료 시점에 알려진 작은 hygiene 항목 두 개를 닫는다.

1. 테스트/런타임에 남아 있는 React Router v7 future-flag warning 제거
2. 얇은 frontend README를 repo 맞춤형 run/test/deploy 문서로 보강

기능 변경이 아니라 운영/온보딩 품질을 끌어올리는 작업.

---

## 현재 진행 상태

- 메인 Task 상태: 🟢 Done (2026-04-19)
- 메모: Phase 1 handoff 문서가 이 두 항목을 명시적으로 follow-up으로 열어둠.

| SubTask | 상태 | 메모 |
|---------|------|------|
| 2.1 | 🟢 Done | `BrowserRouter future={{ v7_startTransition, v7_relativeSplatPath }}` 양 앱 적용 + 테스트 `MemoryRouter` 전체에도 future 주입 |
| 2.2 | 🟢 Done | vitest (22+5 file, 105+15 test) console router warning 0건 확인 — `.sisyphus/evidence/phase2-task-02-router-and-doc-hygiene.txt` |
| 2.3 | 🟢 Done | `frontend/README.md` 보강 (워크스페이스 구조, env, 명령, 크로스링크) |
| 2.4 | 🟢 Done | main-site / admin-site README 재작성 (라우트 맵, 관리자 진입, 계정 안내) |
| 2.5 | 🟢 Done | LOCAL-RUN-GUIDE §8 에 frontend README 링크 추가 |

---

## SubTask 목록

### 🔴 SubTask 2.1: Router future-flag opt-in

**작업자:** Frontend
**예상 소요:** 0.25일

- [ ] `react-router` 사용처에서 `future` flag 활성화 (`v7_startTransition`, `v7_relativeSplatPath` 등)
- [ ] `BrowserRouter`/`createBrowserRouter` 옵션 통일
- [ ] 두 app 모두 동일 정책 적용

### 🔴 SubTask 2.2: Test 출력 검증

**작업자:** Frontend
**예상 소요:** 0.25일

- [ ] `yarn workspace @fsm/main-site test`, `yarn workspace @fsm/admin-site test` 실행
- [ ] router 관련 warning이 콘솔에 출력되지 않음을 확인
- [ ] 출력 evidence 캡처

### 🔴 SubTask 2.3: 루트 frontend README 보강

**작업자:** Frontend
**예상 소요:** 0.5일

- [ ] `frontend/README.md`를 다음 섹션으로 정리:
  - [ ] 워크스페이스 구조 (apps, packages)
  - [ ] 사전 준비 (Node, corepack, yarn 버전)
  - [ ] `yarn install` / `yarn dev:main-site` / `yarn dev:admin-site`
  - [ ] 빌드/테스트/타입체크 명령
  - [ ] 환경변수 (`.env.local` 키)
  - [ ] LOCAL-RUN-GUIDE.ko.md로 가는 링크

### 🔴 SubTask 2.4: 각 앱 README

**작업자:** Frontend
**예상 소요:** 0.25일

- [ ] `frontend/apps/main-site/README.md`: 라우트 맵 요약, 주요 진입 경로
- [ ] `frontend/apps/admin-site/README.md`: 관리자 진입 안내, 관리자 계정 부재 사실 명시

### 🔴 SubTask 2.5: 문서 cross-link 정리

**작업자:** Frontend
**예상 소요:** 0.25일

- [ ] LOCAL-RUN-GUIDE → frontend README 링크
- [ ] frontend README → LOCAL-RUN-GUIDE 링크
- [ ] backend README도 동일 cross-link 정리

---

## 인수 완료 조건 (Acceptance Criteria)

- [ ] `yarn workspace @fsm/main-site test`와 `yarn workspace @fsm/admin-site test` 실행 시 React Router future-flag warning 0건.
- [ ] `frontend/README.md`만으로 처음 받은 개발자가 install → dev server 기동까지 도달 가능.
- [ ] 두 app별 README에 진입 라우트와 인증 가정이 명시됨.
- [ ] Evidence: `.sisyphus/evidence/phase2-task-02-router-and-doc-hygiene.txt`.

---

## 검증 명령

```bash
cd frontend
yarn workspace @fsm/main-site test 2>&1 | grep -i "future flag\|warning" || echo "no router warnings"
yarn workspace @fsm/admin-site test 2>&1 | grep -i "future flag\|warning" || echo "no router warnings"
yarn workspace @fsm/main-site build
yarn workspace @fsm/admin-site build
```

---

## 의존성 매트릭스

| From | To | 관계 |
|------|-----|------|
| 2.1 Router opt-in | 2.2 Test 검증 | flag 적용 후 warning 사라짐 확인 |
| 2.3 루트 README | 2.5 cross-link | 본문 존재 후 링크 작성 |

---

## 리스크 및 완화 전략

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| future flag 활성화로 인한 라우팅 동작 미세 변화 | Medium | 핵심 페이지 수동 확인 + e2e smoke 통과 확인 |
| README 갱신이 실제 코드와 어긋남 | Low | 명령은 실제 실행해서 검증한 출력만 기록 |

---

## 산출물 (Artifacts)

### 코드
- `frontend/apps/main-site/src/main.tsx` 또는 라우터 설정 파일
- `frontend/apps/admin-site/src/main.tsx` 또는 라우터 설정 파일

### 문서
- `frontend/README.md`
- `frontend/apps/main-site/README.md`
- `frontend/apps/admin-site/README.md`
- `.sisyphus/evidence/phase2-task-02-router-and-doc-hygiene.txt`

---

## Commit

```
fix(router): opt into react-router v7 future flags to silence warnings
docs(frontend): rewrite frontend README and per-app entry guides
docs(phase2): record task 02 evidence
```

---

**이전 Task**: [Task 01: E2E 및 CI 베이스라인](./phase2-task-01-e2e-and-ci-baseline.md)
**다음 Task**: [Task 03: 관리자 검수 이력 및 감사 로그](./phase2-task-03-admin-review-history-and-audit.md)
