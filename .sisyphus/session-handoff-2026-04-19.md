# Session Handoff — 2026-04-19

> 2026-04-17 핸드오프 이후 진행된 프론트 리팩토링 대장정 + E2E 검증 + 백엔드 seed 이슈 조치까지 정리.
> 이전 세션 기록: `.sisyphus/session-handoff-2026-04-17.md`

---

## 0. 30초 요약

이번 세션 핵심 4줄:

1. **인프라/환경** — Vite dev server 를 **same-origin proxy** 방식으로 바꾸고, backend CORS 를 `allowedOriginPatterns` 로 전환해 공인 IP 외부 접속 시에도 하드코딩 0 으로 동작하게 정리. 공유기 UPnP 로 5173/5174 포트 매핑, api 8080 은 공유기 포트 충돌로 외부 18080 로 매핑.
2. **리팩토링 지침서** `docs/REFACTORING-GUIDELINES.ko.md` **v1.5** 로 정착. 공통 원칙 7 + FE/BE 가이드 + PR 체크리스트 + §8 사례 2건 기록.
3. **프론트엔드 리팩토링 9커밋 완료** — queryKey factory, 500+줄 페이지 분해, 인라인 스타일 → utility class, i18next 전면 도입, optional chain/fixture 복원, polish (aria/invalidate/주석), supplier-profile + discovery hook 테스트, AsyncBoundary 도입, as-any 제거.
4. **E2E 검증** Playwright 45/45 + vitest 105+15/120 + 공인 IP × 3역할 read/write flow + 권한 가드 모두 green. 백엔드 Mongo seed 누락 이슈 1건 발견 후 즉시 복구.

**다음 액션 (우선순위)**

- (A) **백엔드 리팩토링** — 지침서 §3 기반. `@Value → @ConfigurationProperties`, `!!` 제거, CQRS projection 경계 점검, N+1 감지, domain 예외 sealed class, Kotlin 관용. 이번 세션에서 프론트에 쓴 밀도와 동일하게. 규모 L.
- (B) Phase 2 Task 02~07 — 원래 로드맵. 프론트 리팩토링이 Task 02(router warning, README) 일부를 흡수했으나 별도 task 로 정리 필요할 수 있음.
- (C) 운영 가이드 보강 — 이번에 만난 Mongo seed 사고 재발 방지용 "스키마 변경 후 재시드" 안내 + CI 강화.

사용자 발화 마지막: **"추천대로 ㄱㄱ"** → 즉 B(handoff) 진행 중. 다음은 A(백엔드 리팩토링) 예정.

---

## 1. 세션 타임라인

2026-04-17 이후 발생한 것들을 시간순으로:

1. (04-17→04-18 연장) 지난 세션 handoff 받아 `git pull` → `api-spec.md` 충돌 발견 → 원격 우선 (integer 타입 유지) + 내 신규 endpoint 7개만 이식 후 Phase 2 Task 01 5커밋으로 쪼개 push.
2. Backend CORS / Vite proxy 전환 작업으로 **하드코딩 4곳 → 0곳**. 공인 IP 외부 접속 성공.
3. 리팩토링 지침서 최초 작성 (v1.0) + Vite proxy, CORS allowedOriginPatterns 2사례 §8 에 기록.
4. 프론트 전수 리팩토링 분석 → 권장 순서 (#2 쿼리키 → #4 페이지 → #3 스타일 → #1 i18n → #5/#7/#8 polish → #10 테스트 → #11 AsyncBoundary) 대로 전부 실행.
5. E2E + 리뷰 실행. 백엔드 Mongo seed 누락 발견 → 복구.

---

## 2. 누적 커밋 (origin/main, 본 세션 범위)

이전 세션 마지막: `b5e4cca docs(phase2): record task 01 evidence + handoff`

이후 추가된 커밋:

```
e0c16b2 refactor(fe): introduce Vite proxy for same-origin API calls
d9e8132 refactor(be): switch CORS to allowedOriginPatterns, drop yml list
d07d2d0 docs(refactor): add refactoring guidelines with applied cases
df682b8 refactor(fe): centralize TanStack Query keys in per-feature factories
04d4158 refactor(fe): split oversized pages into focused components
0b71239 refactor(fe): replace inline styles with shared.css utility classes
4b022c5 refactor(fe): introduce i18next with per-feature namespaces
38f77c6 fix(fe): restore optional chains and align test fixtures for string typing
dfbcc98 refactor(fe): polish — aria-label, tighter invalidation, comment cleanup
4546c44 test(fe): add hook unit tests for supplier-profile and discovery
0faaa1c refactor(fe): introduce AsyncBoundary for loading/error/empty states
3c31eaa refactor(fe): drop as-any and tighten useWithdrawQuote signature
```

**12개 커밋**, main HEAD = `3c31eaa`.

---

## 3. 지침서 변경 이력 (`docs/REFACTORING-GUIDELINES.ko.md`)

| 버전 | 변경 |
|---|---|
| 1.0 | 초판. Phase 2 진입 시점 원칙 정리 |
| 1.1 | §8 사례 2: CORS `allowedOriginPatterns` 전환 |
| 1.2 | §2.5.1 Query Key Factory 규약 추가 |
| 1.3 | §2.6 강화: 정적 style 값은 utility class 우선 |
| 1.4 | §2.9 강화: i18n useTranslation + namespace 규약 |
| 1.5 | §2.5.2 AsyncBoundary 패턴 추가 |

---

## 4. 품질 지표 (세션 종료 시점)

| 항목 | 값 |
|---|---|
| type-check main-site | **0** (이전 세션 시작 시 40) |
| type-check admin-site | **0** (이전 세션 시작 시 5) |
| vitest main-site | **105/105** (기존 92 + 신규 13) |
| vitest admin-site | **15/15** |
| Playwright e2e | **45/45** |
| 공인 IP 읽기 smoke | **21/21** |
| 권한 가드 | **6/6** |
| 리터럴 queryKey (production) | **0** |
| 사용자 가시 한국어 인라인 | **0** (주석 제외) |
| production `as any` | **0** |
| 하드코딩 URL/IP/CORS origin | **0** |

---

## 5. 아키텍처/패턴 요약

### 5.1 프론트엔드 (변경 후)

- **Vite proxy**: `vite.config.ts` 2개에 `server.proxy: { '/api': http://localhost:8080/8081, changeOrigin: true }`. 브라우저 상대 경로 호출 → same-origin → CORS 불필요.
- **Backend CORS**: `ApiSecurityConfig.kt`, `AdminSecurityConfig.kt` 에서 `allowedOriginPatterns` + 기본값 `http://*:5173,http://*:5174`. yml 의 `fsm.cors.*` 섹션 삭제됨.
- **Query Key Factory**: 13 feature 각각 `query-keys.ts` — `{ all, lists, list(p), details, detail(id) }` 구조.
- **i18n**: `src/i18n/index.ts` + `src/i18n/locales/ko/<namespace>.json` × 12(main) / 7(admin). `useTranslation("<ns>")` + `t("common:...")` prefix.
- **AsyncBoundary**: `apps/main-site/src/shared/components/AsyncBoundary.tsx` — loading/error/empty/success 4상태 render-function 방식. 2 페이지 적용 (RequestDetailPage, RequestListPage). admin-site 미적용.
- **테스트 setup**: `src/test/setup.ts` 에 `import "../i18n"` 추가 (양 앱).

### 5.2 백엔드 (이번 세션 변경분)

- `ApiSecurityConfig.kt`, `AdminSecurityConfig.kt`: `allowedOrigins(String)` → `allowedOriginPatterns(String)`. 기본값 `http://*:5173,http://*:5174`. property key 도 `fsm.cors.allowed-origin-patterns` 로 변경.
- `application-local.yml` (api-server, admin-server): `fsm.cors.*` 섹션 전체 삭제 (기본값으로 충분).
- 나머지 백엔드 로직은 미변경.

---

## 6. 발견·조치한 이슈

### 6.1 Mongo seed 누락 (조치 완료)

**증상**: `POST /api/requests/{id}/quotes` 호출 시 HTTP 200 응답 바디에 `code: 5000` + `Failed to instantiate RequesterRequestSummaryDocument ... requesterUserId null`.

**근본 원인**: Mongo volume 이 persisted 된 상태에서 seed 스크립트(`02-seed-read-models.js`) 가 과거 버전(requesterUserId/updatedAt 필드 없던 시점)으로 한 번 실행된 후 재실행 안 됨. 스크립트 자체는 이미 idempotent (`_id: /seed_/` deleteMany + re-insert).

**조치**: `./scripts/local/seed-mongodb.sh` 수동 재실행으로 Mongo view 복구. 코드 변경 불필요.

**향후 방지**: 
- `LOCAL-RUN-GUIDE.ko.md` 또는 `docs/TEST-GUIDE.md` 에 "seed 스크립트 변경 후 수동 재시드 필요" 명시 — 아직 반영 안 함.
- 또는 seed 스크립트 버전 체크 + 자동 재적용 로직 — 미설계.
- 지침서 §8 에 사례 3으로 기록할지 후속 판단.

### 6.2 Phase 2 Task 01 branch protection (보류)

**상태**: GitHub 무료 플랜 + private repo 라 API 403. Pro 업그레이드 또는 repo public 전환 시 설정 가능. 사용자 결정 대기.

---

## 7. 현재 인프라 상태 (세션 종료 시)

| 구성 | 상태 | 비고 |
|---|---|---|
| Colima VM | ✅ | macOS Virtualization.Framework |
| MariaDB (13306) | ✅ | `fsm-local-mariadb-mariadb-1`, 컨테이너 |
| MongoDB (27018) | ✅ | `fsm-local-mongodb-mongodb-1`. 이번 세션에서 requester_request_summary_view 재시드 완료 |
| api-server (8080) | ✅ | 백그라운드 Gradle bootRun, 로그 `/tmp/fsm-logs/api-server.log` |
| admin-server (8081) | ✅ | 동일 |
| main-site vite (5173) | ✅ | `yarn workspace @fsm/main-site dev --host 0.0.0.0` |
| admin-site vite (5174) | ✅ | 동일 |

**UPnP 매핑 (공유기 `172.30.1.254`)**

```
 5173 TCP → 172.30.1.42:5173  'fsm-main-site-dev'
 5174 TCP → 172.30.1.42:5174  'fsm-admin-site-dev'
```

(이전에 임시로 뚫었던 `18080→8080`, `8081`은 proxy 전환 후 제거됨. 현재는 프론트 포트만 외부 오픈.)

**공인 IP**: `121.133.86.173` (ISP 할당, 바뀔 수 있음).

**재기동 시**: Playwright `webServer` 가 자체 spawn 하지 않으므로 다음 세션에서 수동 기동 필요 — 핸드오프 §7 참조 `LOCAL-RUN-GUIDE.ko.md` 순서 그대로.

---

## 8. 시드 계정 (변경 없음, 비번 `Test1234!`)

| 역할 | 이메일 |
|---|---|
| ADMIN | `admin@test.com`, `admin2@test.com` |
| REQUESTER | `buyer@test.com`, `buyer2@test.com`~`buyer5@test.com` |
| SUPPLIER | `supplier@test.com`~`supplier8@test.com` |

**Supplier approval 상태 주의**: 일부 supplier 계정은 `verificationState != approved` 라 `/api/supplier/*` 쓰기 호출 시 **403(code=4036)** 로 차단됨. E2E 시 approved supplier (`supplier`, `supplier2`, `supplier3`, `supplier4`) 사용 권장.

---

## 9. 미결 / 후속 작업

### High (다음 세션 착수 후보)

- **백엔드 리팩토링 (지침서 §3)**  
  - `@Value("${x}")` → `@ConfigurationProperties` 이관
  - `!!` non-null assertion 0 달성
  - CQRS 경계 점검 (projection 이 application layer 에 있는지 등)
  - N+1 감지 + projection 사용 명시
  - Domain 예외 sealed class 분류
  - `@ControllerAdvice` 전역 에러 매핑
  - Kotlin 관용 (val 우선, extension 남발 금지 등)
  - 테스트: domain/application/integration 3층 커버리지 상태 확인

### Medium

- **운영 가이드 보강**: Mongo seed 재시드 규약을 `LOCAL-RUN-GUIDE.ko.md` 나 `docs/REFACTORING-GUIDELINES.ko.md §8` 에 기록.
- **Phase 2 Task 02~07** 재평가: 프론트 리팩토링이 흡수한 범위 확인 후 남은 task 재계획.
- **CI 강화**: 현재 workflow 가 type-check/lint 포함하는지 검토. 없다면 추가.
- **AsyncBoundary 확장**: admin-site 에 동일 패턴 적용 + `packages/ui` 승격.

### Low

- GitHub branch protection (Pro 업그레이드 시)
- 프론트 남은 페이지들의 AsyncBoundary 마이그레이션 (Boy Scout)
- packages/ui 에 spacing/typography 토큰 scale 추가 (기본 utility class 로 이미 커버됨, 추가 토큰 필요한지 판단 후)

---

## 10. 다음 세션 시작 권장 행동

1. 이 문서 + `docs/REFACTORING-GUIDELINES.ko.md` + 메모리 `MEMORY.md` 로 컨텍스트 복원.
2. `git log --oneline origin/main~15..origin/main` 으로 커밋 히스토리 확인.
3. 인프라 상태 확인:
   ```bash
   lsof -iTCP -sTCP:LISTEN -n -P | grep -E ":(5173|5174|8080|8081|13306|27018)\b"
   colima status
   ```
   내려가 있으면 `LOCAL-RUN-GUIDE.ko.md` 대로 기동.
4. **권장 다음 액션**: 백엔드 리팩토링 (§9 High). 지침서 §3 기반으로 먼저 전수 조사 agent 돌리고 우선순위 설계.

---

## 11. 참고 파일 빠른 링크

- 리팩토링 지침서: `docs/REFACTORING-GUIDELINES.ko.md` (v1.5, 2026-04-19)
- 직전 핸드오프: `.sisyphus/session-handoff-2026-04-17.md`
- Phase 2 plan: `.sisyphus/plans/phase2-execution-plan.ko.md`
- Phase 2 subplans: `.sisyphus/plans/phase2-subplans/`
- API spec: `.sisyphus/drafts/api-spec.md` (v1.5)
- 로컬 실행 가이드: `LOCAL-RUN-GUIDE.ko.md`
- 테스트 가이드: `docs/TEST-GUIDE.md`

---

## 12. Document History

| 버전 | 날짜 | 변경 |
|---|---|---|
| 1.0 | 2026-04-19 | 초판. 2026-04-17 이후 세션 전체 기록. |
