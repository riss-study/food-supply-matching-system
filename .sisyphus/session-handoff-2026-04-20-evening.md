# Session Handoff — 2026-04-20 (Evening, Mac Mini)

> 같은 날 오전 세션은 다른 PC 에서 진행되어 `.sisyphus/session-handoff-2026-04-20.md` 로 기록됨.
> 본 세션은 **새 머신** (`/Users/riss/project/food-supply-matching-system`) 에서 인프라 부트스트랩 → Phase 2 Task 06 전 SubTask 완료 → 지침서·명세 정리 → Task 06.5 (admin 모더레이션 UI) 까지 총 17 커밋.
>
> - 이전 세션: `.sisyphus/session-handoff-2026-04-20.md` (오전)
> - 미결 항목: `.sisyphus/open-items.md`
> - Phase 2 subplan 상태: `.sisyphus/plans/phase2-subplans-index.ko.md`

---

## 0. 30초 요약

1. **새 Mac 인프라 부트스트랩** — Colima + Docker + Node 20 + Temurin 21 tarball + Yarn 4.5 + 시드 + 4 프로세스 기동. memory `09-infrastructure-ops.md` 의 2026-04-17 절차 그대로 재현. 함정 1건 발견: 복사된 `node_modules` 의 rollup native `.node` 가 macOS Gatekeeper 에 차단됨 → 삭제 후 재설치.
2. **외부 접속 경로 개통** — Vite 기본 `localhost` 바인딩을 `--host` 로 영구 전환 (commit `6b5e6c1`). UPnP 로 4 포트 매핑 (5173/5174/18080/8081). 외부 포트 8080 이 ISP 레벨 차단되어 `18080` 으로 우회. UPnP 휘발성 대비 `EXTERNAL-ACCESS-GUIDE.ko.md` (`3815761`) 작성.
3. **Phase 2 Task 06 Reviews & Ratings 전 SubTask (6.1~6.9) 완료** — 정책 합의 → 도메인 → API → projection → DTO 노출 → main-site UI → supplier detail 리뷰 → admin 모더레이션 + audit → 도메인 테스트 13건 + evidence. 총 11 커밋. CQRS 경계 유지, 계약 우선 원칙 (소급 작성 + 자체 검증) 적용.
4. **문서 부채 2건 해소** — DOC-2 (`api-spec.md §5.1/§5.2` drift) 를 실제 code 와 맞춰 정리하고 버전 v1.9 로 배포. DOC-1 (지침서 §8 사례 누적) 에 Task 06 에서 얻은 사례 3건 추가 (v1.8): 계약 우선 위반 / `Mono.defer` 패턴 / UPnP 휘발성.
5. **Task 06.5 — admin 모더레이션 UI** (`6745bb0`) — 6.8 의 backend-only hide/unhide 를 관리자 UI 로 확장. `GET /api/admin/supplier-reviews` 신규 (hidden/supplierId 필터), admin-site 에 `/supplier-reviews` 라우트 + 필터/페이지네이션/inline hide-unhide 토글 페이지. api-spec v1.10.
6. **검증 지표**: `./gradlew test` 전 모듈 green, `yarn type-check` clean, vitest main 22 파일 / 105 테스트, admin 5 파일 / 15 테스트, 신규 `ReviewCommandServiceTest` 13건 pass, 빌드 production 성공, E2E smoke 9+4 시나리오 수동 검증 통과.

**총 커밋**: 17 (전부 `origin/main` push 완료). HEAD 는 `6745bb0` (본 핸드오프 커밋 전 기준).

**다음 세션 진입점**: 아래 §5 "다음 할 일 리스트" 순서대로. 사용자 수동 테스트 피드백 대기 중 (§7).

---

## 1. 세션 타임라인

1. 오전 세션 (다른 PC) 종결 직후 본 Mac Mini 에서 재개. 이 PC 에는 Docker/Java/Node 전혀 없음을 확인.
2. `.gitignore` 에 `memories/` 추가 커밋 (`299ba18`). local-only memory 디렉토리 대응.
3. Task 06 정책 4종 합의 기록 (`2576d75`).
4. 인프라 부트스트랩: Colima/Docker/Node 20/JDK 21/Yarn 4.5 전부 설치 + DB 시드 + 4 프로세스 기동 + 스모크 18건 통과. memory `01-identity-and-environment.md` 의 절차와 일치. 발견 함정: `frontend/node_modules/@rollup/rollup-darwin-arm64/*.node` Gatekeeper 차단 (복사된 binary 의 code signature 무효) → `rm -rf node_modules` 후 재설치 필요.
5. 사용자가 외부 접속 요구 → Vite `--host` 영구 변경 (`6b5e6c1`) + UPnP 4 포트 매핑. 외부 8080 은 ISP 차단으로 18080 우회.
6. Task 06 본격 착수: 정책 합의 이후 SubTask 6.2 부터 구현 시작.
7. 6.2 완료 (`8be41f3`) 직후 사용자 지적: "API 명세 먼저 만들고 그 명세에 맞춰 코드" (계약 우선). 소급 작성 + 자체 검증 사이클 수립 (`1809069`, `21dfb80`).
8. 이후 6.3~6.9 는 "스케치 → 자체 검증 → 구현 → 자체 리뷰 → 테스트 → 결함 수정 → 재검증" 을 1 SubTask 단위로 반복. 사용자 지시 `너가 직접 다해 나한테 물어보지 말고`.
9. 6.9 에서 domain unit test 작성 중 `ensureContentAllowed` 동기 throw 가 StepVerifier 에서 NPE 를 유발하는 결함을 자체 발견 → `Mono.defer` 패턴으로 수정.
10. Task 06 종결 후 사용자가 공인 IP 접속이 다시 안 된다고 지적 (UPnP 매핑이 세션 사이에 날아감). `upnpc -a` 로 재등록 + `EXTERNAL-ACCESS-GUIDE.ko.md` 작성 (`3815761`) — 영구 해결은 공유기 정적 포워딩으로 사용자 본인이 처리.
11. 사용자 복귀 지시 → DOC-2 (`api-spec` drift) + DOC-1 (지침서 §8 사례 누적) 동시 해소 (`919e971`).
12. Task 06.5 합의 (admin UI 는 운영상 필수) → spec 우선 작성 → backend GET list endpoint → admin-site `features/supplier-reviews` 신규 → 필터/페이지네이션/hide-unhide 토글 + nav 메뉴 (`6745bb0`).
13. 본 핸드오프 갱신 + open-items 갱신 + FE/BE 코드 리뷰 및 검증 단계.

---

## 2. 커밋 (origin/main, 본 세션 범위)

오전 세션 마지막: `d3db628 docs: session handoff 2026-04-20 + guidelines v1.7 (사례 4~6)`

이후 추가된 커밋 (시간순):

```
299ba18  chore: ignore local-only memories/ directory
2576d75  docs(phase2): record Task 06 policy decisions (2026-04-20)
6b5e6c1  chore(fe): bind vite dev server to all interfaces
8be41f3  feat(review): add Review aggregate, command handlers, moderation (Task 06 SubTask 6.2)
1809069  docs(api-spec): add §3.11 Review + §4.4 admin moderation (v1.6)
21dfb80  docs(api-spec): v1.7 review-section self-verification fixes
ad6687a  feat(review): add api-server review endpoints (Task 06 SubTask 6.3)
1c620a9  feat(review): project ratingAvg/ratingCount into supplier views (Task 06 SubTask 6.4)
520d8b2  feat(supplier): expose ratingAvg/ratingCount/recentReviews on discovery (Task 06 SubTask 6.5)
fade13e  feat(main-site): add review writing UI (Task 06 SubTask 6.6)
0e36772  feat(main-site): show rating summary + reviews on supplier detail (Task 06 SubTask 6.7)
8285ad0  feat(admin): add supplier review moderation + audit (Task 06 SubTask 6.8)
70498ff  test(review): add domain unit tests + Task 06 evidence (SubTask 6.9)
3815761  docs: add external access guide (router port forwarding + DHCP reservation)
919e971  docs: resolve DOC-2 spec drift + add Task 06 lessons (guidelines v1.8)
246698d  docs: session handoff 2026-04-20 evening (new Mac + Task 06 close + docs)
6745bb0  feat(admin): supplier review moderation UI + list endpoint (Task 06.5)
```

17 커밋.

---

## 3. Phase 2 subplan 최종 상태

| Task | 상태 | 비고 |
|------|------|------|
| 01 | 🟢 Done | E2E + CI baseline (이전 세션) |
| 02 | 🟢 Done | Router + README (이전 세션) |
| 03 | 🟢 Done (축소) | Admin review history 축소판 (이전 세션) |
| 04 | 🟢 Done | Supplier sort/index (이전 세션) |
| 05 | 🟢 Done | Swagger polish (이전 세션) |
| 06 | 🟢 **Done (본 세션)** | Reviews & Ratings 9 SubTask 전체. BE+FE+admin. evidence 파일 있음 |
| 06.5 | 🟢 **Done (본 세션, 보강)** | admin 모더레이션 UI + GET /api/admin/supplier-reviews. 6.8 backend-only 확장 |
| 07 | ⚪ Deferred | Hot query hardening — 측정 선행 |

Wave 1~3 (Task 01~06) 전부 완료. Wave 4 (Task 07) 는 트리거 조건 충족 시 재개.

---

## 4. 인프라 / 환경 상태 (이 PC 기준)

### 머신

- macOS arm64 (이 세션에서 Mac Mini 인 걸로 확인됨, `risss-Mac-mini.local`)
- 작업 루트: `/Users/riss/project/food-supply-matching-system` (오전 세션의 `/Users/kyounghwanlee/Desktop/...` 와 다름)
- Git user: `riss-study`
- 공인 IP: `121.133.86.173` (오전 PC 와 동일, 같은 공유기 추정)
- LAN IP: `172.30.1.81`, 게이트웨이 `172.30.1.254`

### 설치된 도구 (본 세션에서 전부 신규 설치)

| 도구 | 위치 / 버전 |
|------|-------------|
| Colima | `/opt/homebrew/bin/colima` |
| docker / docker-compose | `/opt/homebrew/bin/docker` (compose plugin 은 `~/.docker/config.json` 의 `cliPluginsExtraDirs` 로 등록) |
| Temurin JDK 21 | `~/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home` (버전 21.0.10+7, tarball 직접 설치) |
| Node 20.20.2 | `/opt/homebrew/opt/node@20/bin/node` (keg-only) |
| corepack / Yarn 4.5 | `/opt/homebrew/bin/yarn` (corepack shims 를 `/opt/homebrew/bin` 에 등록해야 PATH 에서 발견됨) |
| miniupnpc (`upnpc`) | `/opt/homebrew/bin/upnpc` |

### 기동 상태

현재 살아 있음 (사용자 수동 테스트용):

- Colima VM running
- fsm-local-mariadb-mariadb-1 (healthy, 13306)
- fsm-local-mongodb-mongodb-1 (healthy, 27018)
- api-server (8080, `*:` bind, pid java 36251 기준 — 재기동 시 바뀜)
- admin-server (8081, `*:` bind)
- main-site dev (5173, `*:` bind, `--host` 적용)
- admin-site dev (5174, `*:` bind, `--host` 적용)

로그: `/private/tmp/fsm-logs/{api-server,admin-server,main-site,admin-site}.log`

### 외부 접속

UPnP 매핑 재등록 상태 (휘발성):

| 외부 | → | 내부 | 용도 |
|------|---|------|------|
| 5173 | → | 172.30.1.81:5173 | main-site |
| 5174 | → | 172.30.1.81:5174 | admin-site |
| **18080** | → | 172.30.1.81:8080 | api-server (외부 8080 ISP 차단 우회) |
| 8081 | → | 172.30.1.81:8081 | admin-server |

**사용자 숙제**: 공유기 관리자 페이지에서 정적 포트 포워딩 + DHCP 예약 설정 → UPnP 휘발성 문제 종결. 가이드는 `EXTERNAL-ACCESS-GUIDE.ko.md` 참조.

### 시드 / 테스트 계정

오전 세션과 동일 (memory `01-identity-and-environment.md` 참조). 비밀번호 전체 `Test1234!`.

- 테스트용 closed request + selected quote: `req_seed_06` (`usr_seed_buyer01`) + `quo_seed_05` (`sprof_seed_04`). Task 06 리뷰 작성 플로우 검증에 사용.

### CI 상태

- frontend-ci: green (오전 세션 `462a43f` 이후 유지)
- backend-ci: green (오전 세션 `bc9f3d1` 이후 유지)
- 본 세션 커밋들도 모두 CI 영향 없음 또는 green 유지

---

## 5. 다음 할 일 리스트 (우선순위 순)

### 🥇 1순위 — 사용자 수동 테스트 피드백 대기

Task 06 기능이 대규모로 추가됐으니 **사용자 수동 검증** 이 실제 결함 발견의 가장 높은 가치 단계. `EXTERNAL-ACCESS-GUIDE.ko.md` 대로 공유기 정적 포워딩을 한 뒤, 아래 플로우를 외부 네트워크 (LTE 폰 등) 에서 시도:

1. `http://121.133.86.173:5173` 접속 → `buyer@test.com` / `Test1234!` 로그인
2. 내 의뢰 → `req_seed_06` → 견적 비교
3. selected 상태 공급사 행에 "리뷰 작성" 버튼 → 클릭 → 별점 + 텍스트 → 등록
4. 공급자 상세 (`/suppliers/sprof_seed_04`) 에서 평균 평점 + 리뷰 목록 + 마스킹 확인
5. `admin@test.com` 로그인 → 해당 리뷰 `/api/admin/supplier-reviews/{id}/hide` (Swagger 또는 curl) → 공개 목록에서 제거 확인

발견된 결함/UX 이슈는 다음 세션에서 fix.

---

### 🥈 2순위 — 트리거 대기 항목 중 먼저 터지는 것

memory `08-current-state-and-roadmap.md` 의 Next-2~5 모두 "트리거 대기" 상태. 현재 우선순위:

- **BE-4** (`supplier_search_view` 숫자 필드 정규화) — 트리거: supplier 50+ 건 또는 UX 불만. MVP 에선 안 터짐.
- **BE-1** (application layer ResponseStatusException 일관화) — 트리거: 프론트가 에러 code 기반 분기 실제 사용 시. Review UI 가 이미 code 분기 (`4036/4094/4222`) 쓰므로 점진적 트리거 중. 다만 Review 는 이미 domain exception 으로 돼 있어 BE-1 영향 없음. 다른 feature 쪽 불만 발생 시.
- **BE-3** (Boy Scout domain test) — 트리거: 버그 발견 또는 Task 06 같은 신규 feature. Task 06 에서 review 쪽은 이미 13개 테스트 있음. 기존 모듈 (quote/request/notice) 도 boy-scout 으로 보강 여지.
- **FE-1 / FE-2** (AsyncBoundary 확장) — 트리거: 해당 페이지 터치할 때. Review 작성 다이얼로그는 AsyncBoundary 가 아닌 직접 상태 관리 (mutation 기반이라 적합). 다른 페이지 손댈 때 Boy Scout.
- **FE-3** (`packages/ui` 승격) — 트리거: 공유 컴포넌트 5개 이상. `RatingStars` 는 1개 추가 (현재 main-site 만). admin-site 가 리뷰 모더레이션 UI 만들면 2개째.

즉시 할 만한 후보: **admin-site 의 supplier 리뷰 모더레이션 UI 신규** (admin 이 hide/unhide 를 Swagger 대신 UI 에서 할 수 있게). subplan §6.8 에는 API 만 있지만 실사용성 보강에 자연스러움.

---

### 🥉 3순위 — Phase 3 준비 / 측정 / 정책

- **Task 07 측정 수집** — 현 supplier 3건으로는 트리거 불가. 시드 확장 + 부하 측정 도구 (wrk / k6) 결합하면 Phase 3 진입 근거가 됨.
- **OP-3 branch protection** — GitHub Pro 결제 또는 repo 공개 여부 결정.
- **OP-4 관리자 audit 검색 API** — 규제/감사 요구 발생 시.

---

## 6. 주의사항 / 함정 (본 세션 신규)

1. **`node_modules` 복사본은 Gatekeeper 에 걸린다** — 다른 Mac 에서 복사한 `frontend/node_modules/@rollup/rollup-darwin-arm64/rollup.darwin-arm64.node` 의 code signature 가 무효로 판정되어 `dlopen disallowed by system policy` 에러. 해결: 해당 디렉토리 전체 삭제 후 `yarn install`. PC 간 이동 시마다 주의.
2. **UPnP 매핑은 휘발성** — 공유기 재부팅/Mac sleep 시 사라짐. `upnpc -a` 재등록 가능하지만 근본 해결은 공유기 정적 포워딩 + DHCP 예약. `EXTERNAL-ACCESS-GUIDE.ko.md` 에 상세 정리됨.
3. **외부 8080 은 ISP 차단 가능** — 한국 가정용 회선에서 well-known 포트 막는 경우 있음. api-server 는 외부 18080 → 내부 8080 으로 우회 매핑.
4. **Reactor 의 `.then(Mono)` 는 eager 평가** — `.then(Mono.error(...))` 같은 fallback 은 상위 에러와 무관하게 `Mono.error` 가 만들어짐. skip 하려면 `.then(Mono.defer { ... })` 로 감쌀 것. 지침서 §8 사례 8.
5. **Spring WebFlux 는 동기 throw 를 catch 해 준다** — 프로덕션 curl 테스트는 통과해도 StepVerifier 는 실패함. domain 서비스는 항상 `Mono.error` 로 에러 반환. 지침서 §8 사례 8.
6. **Review admin 경로 이름 충돌** — `/api/admin/reviews` 는 기존 검수 (verification submission) 큐. 공급자 리뷰 모더레이션은 `/api/admin/supplier-reviews` 로 분리. spec §4.1 ↔ §4.4.
7. **Review `rating TINYINT CHECK` 제약** — MariaDB 11.4 는 CHECK 지원. 하지만 R2DBC 측 검증은 없음. DTO `@Min(1) @Max(5)` + domain 에선 trust — 미준수 데이터는 DB 가 거부.
8. **계약 우선은 domain signature 에도 적용** — HTTP 경계가 아니라도 command method signature / sealed exception / DDL 이 외부 API shape 를 굳힘. "spec 먼저" 는 모든 신규 도메인 진입 시 체크. 지침서 §8 사례 7.

---

## 7. 열린 대화 / 판단 남은 지점

- **Task 06 사용자 수동 테스트 결과** — 아직 feedback 없음. 외부 접속 정적 포워딩 후 결과가 나와야 함.
- **admin-site 리뷰 모더레이션 UI 여부** — subplan 범위 밖이지만 실제 운영에서 Swagger 만으로 hide/unhide 하는 건 불편. 사용자 판단 필요.
- **BE-1 이관 타이밍** — Review UI 가 code 분기 (4031/4036/4094/4222) 쓰지만 Review domain 은 이미 sealed exception. 다른 도메인 feature 에서 code 분기 요구 생기면 application layer 도 일괄 이관.
- **FE-3 packages/ui 승격** — `RatingStars` 가 admin-site 에서도 쓰이기 시작하면 승격 트리거.
- **Task 07 측정 착수 조건** — 시드를 수십~수백 건으로 확장하는 데 먼저 동의 필요.

---

## 8. 참고 문서 인덱스

### 본 세션 산출물

- `.sisyphus/evidence/phase2-task-06-reviews-and-ratings-foundation.txt` — Task 06 전 SubTask 결과 + 정책 이행 매트릭스 + E2E smoke 9 시나리오
- `.sisyphus/plans/phase2-subplans/phase2-task-06-reviews-and-ratings-foundation.md` — 정책 결정 기록 + SubTask 전체 Done
- `EXTERNAL-ACCESS-GUIDE.ko.md` — 공유기 정적 포워딩 + DHCP 예약 가이드
- `docs/REFACTORING-GUIDELINES.ko.md` v1.8 — §8 사례 9건 (신규 3건: 계약 우선 위반 / Mono.defer / UPnP 휘발성)
- `.sisyphus/drafts/api-spec.md` v1.10 — §3.11 Review, §4.4 admin supplier-reviews (POST hide/unhide + GET list), §5.1/§5.2 code 와 일치
- Task 06.5 admin UI: `backend/admin-server/.../supplierreview/` + `frontend/apps/admin-site/src/features/supplier-reviews/` + locale `supplier-reviews.json`

### 누적 세션 핸드오프

- `.sisyphus/session-handoff-2026-04-17.md` — 인프라 구축 + Task 01
- `.sisyphus/session-handoff-2026-04-19.md` — 프론트+백엔드 리팩토링 23 커밋
- `.sisyphus/session-handoff-2026-04-20.md` — 오전 (다른 PC): Task 02~05 + CI 복구 + 지침서 v1.7
- `.sisyphus/session-handoff-2026-04-20-evening.md` — **본 파일** (이 PC 저녁): 인프라 부트스트랩 + Task 06 + 문서 정리

### 기타

- `.sisyphus/open-items.md` — 미결 항목 (DOC-1/DOC-2 해결 표시됨)
- `api-spec.md` (실 경로 `.sisyphus/drafts/api-spec.md`) — API 계약 SSOT
- `LOCAL-RUN-GUIDE.ko.md` — 로컬 기동 + 재시드 규약

---

## 9. 현재 HEAD

```
6745bb0 feat(admin): supplier review moderation UI + list endpoint (Task 06.5)
```

`origin/main` 과 동기화. 본 핸드오프 갱신 + open-items 갱신 커밋 전 기준.

---

## 10. 다음 세션 첫 5분 체크리스트

새 세션 진입 시 (이 PC 든 다른 PC 든):

```bash
# 1. 동기화
cd ~/project/food-supply-matching-system   # (이 PC 기준, 다른 PC 는 경로 조정)
git pull
git log --oneline -5

# 2. 문서 스캔
head -80 .sisyphus/session-handoff-2026-04-20-evening.md
cat .sisyphus/open-items.md | head -40

# 3. 인프라 살아있나
docker ps   # mariadb/mongodb 기대
lsof -i :8080 -i :8081 -i :5173 -i :5174 -sTCP:LISTEN   # 4 포트 기대
curl -s http://localhost:8080/actuator/health | head -1

# 4. 죽어 있으면 기동
# cf. LOCAL-RUN-GUIDE.ko.md §2
bash backend/scripts/local/seed-all.sh   # DB 재기동 필요 시
# 백엔드/프론트 bootRun/dev 는 각자 터미널에서

# 5. 외부 접속 UPnP 매핑 현황
upnpc -l | grep TCP
# 날아갔으면 4줄 재등록
# upnpc -a 172.30.1.81 5173 5173 TCP 0
# upnpc -a 172.30.1.81 5174 5174 TCP 0
# upnpc -a 172.30.1.81 8081 8081 TCP 0
# upnpc -a 172.30.1.81 8080 18080 TCP 0
```

사용자 테스트 피드백이 있으면 fix 사이클. 없으면 §5 다음 할 일 리스트의 1순위부터.
