# 리팩토링 지침서

> FSM (Food Supply Matching) 프로젝트 전용. 프론트(React/TS monorepo) + 백엔드(Kotlin/Spring WebFlux).

## 목적

기술부채가 쌓이기 전에 잡아내는 기준. 새 기능 추가 시 지켜야 할 규칙, 기존 코드 손댈 때 판단 근거.

**철칙 3줄 요약**
1. **하드코딩 금지.** URL/IP/시크릿/매직넘버는 설정 또는 토큰으로.
2. **단일 출처(SSOT).** 같은 값/로직이 두 곳 이상 있으면 공통화 대상.
3. **경계만 방어.** 입력 경계에서 한 번만 검증, 내부는 trust.

---

## §1. 공통 원칙

### 1.1 SSOT (Single Source of Truth)
- 동일한 값·타입·규칙이 2곳 이상이면 리팩토링 후보.
- 예: API endpoint 경로는 `api-spec.md` → `packages/types` → 각 앱. 양쪽이 틀어지면 문서 먼저 맞추고 코드 반영.

### 1.2 설정 외부화
- 환경별 값(URL, 포트, 토큰, feature flag)은 yml/env로. 코드에 문자열 박지 않는다.
- 기본값은 "개발이 바로 되는 값"으로 제공하되 프로덕션 값은 절대 fallback에 안 넣는다.

### 1.3 계약 우선 (Contract-first)
- API 수정은 `api-spec.md` 먼저 → backend DTO/controller → frontend 타입/호출 순서.
- 문서와 코드가 다르면 **문서가 진실**. 먼저 맞추고 코드 바꾼다.

### 1.4 Dead code / 주석 제거
- 불린 주석, 미사용 import, 호출자 없는 함수는 삭제.
- "// 추후 제거", "// TODO"는 티켓 번호 없이 남기지 않는다.

### 1.5 순수 로직과 IO 분리
- 네트워크/DB/파일 호출은 별도 레이어. 도메인 로직은 순수 함수로.
- 순수 로직은 단위 테스트가 쉽고 리팩토링 안전함.

### 1.6 경계에서만 검증
- 외부 입력(HTTP 요청, 사용자 입력)만 validation.
- 내부 모듈 호출엔 중복 validation 금지. trust chain.

### 1.7 작은 단위 커밋
- "리팩토링"과 "기능 변경"을 같은 커밋에 섞지 않는다.
- 리뷰어가 diff 한 번 볼 때 질문이 하나여야 한다.

---

## §2. 프론트엔드 가이드 (`frontend/`)

### 2.1 모노레포 경계
- `apps/*` ↔ `packages/*` 만 의존. app → app import 금지.
- 공유 가치가 생기면 `packages/`로 승격:
  - 타입/API 계약 → `packages/types`
  - 유틸리티/axios/env 접근 → `packages/utils`
  - UI 컴포넌트/토큰 → `packages/ui`
  - eslint/tsconfig/vite preset → `packages/config`

### 2.2 API 호출
- **baseURL 절대 하드코딩 금지.** `packages/utils`의 `createApiClient` 사용.
- dev 환경에선 **Vite proxy 우선.** 상대경로 `/api/...`로 호출하고 `vite.config.ts`에서 `server.proxy` 설정.
  - 장점: CORS 불필요, IP 바뀌어도 수정 0, env 파일 최소화.
  - 예: `apps/main-site/vite.config.ts` → `server.proxy: { '/api': 'http://localhost:8080' }`
- axios interceptor는 `createApiClient` 한 군데에서만. 401 핸들링도 한 곳.

### 2.3 환경변수
- `VITE_*` 이외는 브라우저 번들에 노출 안 된다. 비밀값 넣지 말 것.
- `.env.example`는 커밋, `.env.local`은 gitignore.
- 기본값이 필요한 var는 `packages/utils`의 getter에서 한 번만 fallback.

### 2.4 타입
- 백엔드 응답 타입은 `packages/types`에 정의. 각 app이 다시 만들지 않는다.
- `any`, `as unknown as`, `@ts-ignore` 금지. 필요하면 type guard/brand type.
- `ApiEnvelope<T>` 같은 제네릭은 `types`에 있는 걸 재사용.

### 2.5 상태관리
- **서버 상태** = TanStack Query. 같은 데이터 두 번 fetch 금지, 쿼리키로 공유.
- **클라이언트 전역 상태** = Zustand. atomic하게 쪼개고, 큰 store 하나 지양.

#### 2.5.1 Query Key Factory (필수)

**문자열 리터럴 queryKey 금지.** feature별 `query-keys.ts` 파일에서 factory 객체로 관리.

```ts
// features/<feature>/query-keys.ts
export const requestKeys = {
  all:     ['requests'] as const,
  lists:   () => [...requestKeys.all, 'list'] as const,
  list:    (p: RequestListParams) => [...requestKeys.lists(), p] as const,
  details: () => [...requestKeys.all, 'detail'] as const,
  detail:  (id: string) => [...requestKeys.details(), id] as const,
}
```

사용:

```ts
useQuery({ queryKey: requestKeys.detail(id), ... })
queryClient.invalidateQueries({ queryKey: requestKeys.all })      // 이 feature 전부
queryClient.invalidateQueries({ queryKey: requestKeys.lists() })  // list 계층만
queryClient.invalidateQueries({ queryKey: requestKeys.detail(id) }) // 1건만
```

**규칙**
- `as const`로 튜플 고정해 TS 추론 유지
- `all`이 root, 하위는 항상 `[...all, ...]` prefix로 구성 → 계층적 invalidate 가능
- feature 경계를 넘는 invalidation은 import로 다른 factory를 참조 (예: quote mutation이 `requestKeys.detail(requestId)`도 invalidate)
- 문자열 오타로 인한 silent bug (`supplier-request` vs `supplier-requests` 등) 원천 차단

**안티패턴**
- `useQuery({ queryKey: ['requests', 'list', params] })` — 리터럴 금지
- `invalidateQueries({ queryKey: ['quotes'] })` — factory 거치지 않은 광범위 invalidate. 의도면 `quoteKeys.all`로.
- 파라미터 순서 다른 두 객체로 같은 요청 2회 캐시됨 — query function 내부 또는 factory 단계에서 정규화.

#### 2.5.2 비동기 상태 렌더링 — AsyncBoundary

- `shared/components/AsyncBoundary` 로 loading/error/empty/success 4상태 분기 공통화.
- 각 페이지에서 `if (isLoading) ... if (error) ...` 같은 조기 반환 반복 제거.

```tsx
<AsyncBoundary
  isLoading={isLoading}
  error={error}
  data={data}
  loadingFallback={<p>{t("common:loading")}</p>}
  errorFallback={<p>{t("common:errorOccurred")}</p>}
  isEmpty={(d) => d.items.length === 0}
  emptyFallback={<EmptyState />}
>
  {(data) => <Content data={data} />}
</AsyncBoundary>
```

- `children` 은 render-function — 진입 시 `data` 는 non-nullable 로 narrowing.
- 지금은 main-site 내부에만 존재. admin-site 도 필요해지면 `packages/ui` 로 승격.

### 2.6 스타일링
- 색상/간격/폰트는 `packages/ui`의 토큰(`var(--xxx)`)만. 인라인 `#fff`, `16px` 금지.
- **정적 style 값은 `shared.css`의 utility class 우선** — 예: `flex`, `flex-col`, `gap-8`, `mb-16`, `p-24`, `text-muted`, `text-base`, `font-bold`, `cursor-pointer`, `text-center`, `items-center`. 매핑 없는 경우에만 utility class 추가하거나 `var(--xxx)` 토큰 활용.
- 동적 값 (ternary, 계산식, 사용자 입력)은 인라인 `style` 허용.
- 반복되는 UI 패턴(버튼, 카드, 모달)은 `packages/ui`로 승격.
- Emotion `styled`는 컴포넌트 단위, 페이지 안에 CSS 수십 줄 쌓지 말 것.

### 2.7 라우팅
- React Router future-flag 경고가 뜨면 그 자리에서 대응. 무시하고 넘기지 않는다.
- 인증 가드는 라우터 레벨 한 곳. 각 페이지에서 중복 체크 금지.

### 2.8 테스트
- 단위 = Vitest. e2e = Playwright (`apps/main-site/e2e/`).
- vitest는 `e2e/**` exclude. 경계를 섞지 않는다.
- e2e는 실제 backend + DB 기동 전제. mock 금지.
- Flaky 허용 0. 한 번 불안정하면 그 자리에서 원인 추적.

### 2.9 접근성/국제화
- 상호작용 요소엔 aria-label 또는 text content. 아이콘만 있는 버튼 특히 주의.
- **사용자 가시 텍스트는 전부 i18n 리소스.** 인라인 한국어 금지 (코드 주석 예외).
  - `import { useTranslation } from "react-i18next"` + `const { t } = useTranslation("<feature-ns>")`
  - feature별 namespace JSON (`src/i18n/locales/ko/<ns>.json`)
  - 공통 어휘(로딩/저장/취소 등)는 `common.json` 재사용, `t("common:save")` prefix
  - 동적 값: interpolation 사용. json `"suffix": "{{count}}건"`, 코드 `t("suffix", { count })`
  - 상태 라벨 맵 (`Record<State, string>`) 은 json 으로 옮기고 `t(\`state.${s}\`)` 동적 호출
  - 테스트 setup 에 `import "../i18n"` 추가 — `t()` 가 실제 번역 반환하도록

---

## §3. 백엔드 가이드 (`backend/`)

### 3.1 모듈 경계 (CQRS)
- `api-server` / `admin-server` = HTTP 진입점.
- `command-domain-*` = 쓰기 도메인 (Entity, Aggregate, Command Service).
- `query-model-*` = 읽기 모델 (Mongo view document, Query Service).
- **규칙**: 쓰기 도메인이 읽기 모델을 몰라야 한다. 이벤트 또는 projection으로만 연결.
- 도메인 간 직접 import가 생기면 경계가 무너지는 신호.

### 3.2 설정
- 기본값: `application.yml` (공통).
- 프로파일: `application-{profile}.yml` (local/dev/prod).
- 비밀값: 환경변수 (`${ENV_VAR}`) 또는 vault. yml에 평문 금지.
- 타입 안전 설정은 `@ConfigurationProperties` 사용. `@Value` 단건 주입은 최소화.

### 3.3 API 설계
- URL, 메소드, 응답 포맷은 `api-spec.md`가 정한다.
- 모든 응답은 `{ code, message, data, meta? }` 엔벨로프. 단일 객체나 배열 그대로 노출 금지.
- 에러 코드는 4자리 (`4001`, `4035` …) 공통 규약.

### 3.4 Controller / Service 분리
- Controller: 요청 파싱, 인증 컨텍스트, DTO ↔ command/query 변환. 비즈니스 로직 금지.
- Application Service: 트랜잭션 경계, 여러 도메인 오케스트레이션.
- Domain: 순수 비즈니스 로직, 외부 IO 모름.

### 3.5 보안
- CORS origin은 `fsm.cors.allowed-origins` (yml) 한 곳. controller 단위 `@CrossOrigin` 금지.
- JWT 검증은 `JwtAuthenticationWebFilter` 한 필터. 체인 위치 고정.
- Role 가드는 `@PreAuthorize` 또는 controller 시작부 explicit check. 중복 방어 금지.

### 3.6 데이터 접근
- **쓰기** = JPA/R2DBC entity. dirty checking에 의존, raw SQL은 예외적으로만.
- **읽기** = Mongo view document. 조인 대신 projection.
- N+1 감지: 테스트에서 SQL/query count assert.
- `findAll()` 같은 unbounded 쿼리 금지. 항상 pagination.

### 3.7 트랜잭션
- `@Transactional` 은 application service. domain/repository에 걸지 않는다.
- 외부 HTTP/메시징 호출은 트랜잭션 **밖**. 실패 시 compensation 또는 outbox.

### 3.8 에러 처리
- 도메인 예외는 sealed class로 분류. `RuntimeException` generic throw 금지.
- 전역 `@ControllerAdvice`에서 매핑. controller 안에 try/catch 반복 금지.
- 로그는 에러 레벨 한 번. 같은 에러 3번 로깅되는 패턴 잡는다.

### 3.9 테스트
- 도메인 = 순수 단위 테스트 (DB/네트워크 모름).
- application = mock repository/service.
- integration = Testcontainers (MariaDB/Mongo 실제 구동).
- CI에선 세 레이어 다 돌아야 한다.

### 3.10 Kotlin 관용
- `data class` 적극 사용 (DTO, VO).
- `val` 우선, `var`는 상태 변이가 필수일 때.
- `!!` (non-null assertion) 거의 금지. 필요하면 `requireNotNull` + 메시지.
- extension function 남발 금지: 도메인 의미가 있을 때만.

---

## §4. 리팩토링 워크플로

### 4.1 순서
1. **탐색** — 영향 범위 확인 (grep/glob, 의존 그래프).
2. **안전망** — 기존 테스트 돌려서 baseline green 확보. flaky 있으면 먼저 잡는다.
3. **쪼개기** — 하나의 PR = 하나의 관심사. 5개 파일 이상이면 분할 가능한지 다시 본다.
4. **실행** — 변경 후 테스트 다시 실행. 단위→통합→e2e.
5. **커밋** — 리팩토링은 별도 커밋. `refactor:` prefix. 기능 변경 섞지 않는다.
6. **리뷰** — §5 체크리스트.

### 4.2 안 할 것
- 건드린 김에 옆 파일까지 정리하는 "서비스 리팩토링". 스코프 넘으면 티켓 따로.
- 테스트 없이 "작은 변경이니까" 지나가기. 작은 변경도 회귀 만든다.
- 구조만 바꾸면서 이름도 바꾸기. 리뷰어가 diff를 못 읽는다.

---

## §5. PR / 리뷰 체크리스트

### 공통
- [ ] 하드코딩 URL/IP/비밀값/매직넘버 없음
- [ ] 중복 코드 없음 (같은 로직 2곳 이상)
- [ ] Dead code, 미사용 import 없음
- [ ] 주석은 WHY만 (WHAT은 코드로)
- [ ] 타입/스키마가 기존 공유 레이어와 일치
- [ ] 테스트 추가/수정 있음
- [ ] 로그 레벨 적절 (에러 과잉/부족 없음)
- [ ] 에러 처리 일관

### 프론트 전용
- [ ] `apps/*` → `apps/*` 의존 없음
- [ ] `any`, `@ts-ignore` 없음
- [ ] 인라인 색상/간격 없음 (토큰 사용)
- [ ] 쿼리키 규약 준수
- [ ] a11y (키보드 내비, aria) 최소 확인

### 백엔드 전용
- [ ] CQRS 경계 준수 (command→query import 없음)
- [ ] `@Transactional` 위치 적절
- [ ] `findAll()` 같은 unbounded 쿼리 없음
- [ ] `!!`, generic `RuntimeException` 없음
- [ ] N+1 가능성 확인

---

## §6. 안티패턴 블랙리스트

### 프론트
- `fetch('http://localhost:8080/api/...')` — baseURL 하드코딩
- `process.env.XXX` — Vite는 `import.meta.env.VITE_*`만
- `useEffect(() => { setState(...) }, [state])` — 렌더 루프
- `value as any` — 타입 무시
- 페이지 컴포넌트 500줄 넘김 — 분해 필요

### 백엔드
- controller에서 repository 직접 호출 (service 건너뜀)
- `@Autowired` 필드 주입 — 생성자 주입 쓸 것
- `Optional<T>` param/return — Kotlin이면 nullable로 충분
- entity를 DTO로 그대로 반환 — 경계 누수
- `String` id 필드를 내부에서도 raw String — value class 검토
- application-local.yml에 프로덕션 시크릿

### 공통
- 이름만 바꾸는 rename-only 리팩토링을 feature PR에 섞어 넣기
- `// FIXME` 주석만 남기고 티켓 안 만들기
- 테스트 커버리지 0인 신규 모듈

---

## §7. 점진 적용 전략

기존 코드를 한 번에 규칙에 맞추지 않는다. **Boy Scout Rule** 적용:

1. **신규 코드는 100% 준수.**
2. **기존 코드는 "건드릴 때만" 개선.** 같은 함수 수정하면서 주변 스타일도 맞춘다. 단, §4.2 스코프 규칙은 지킨다.
3. **대규모 정리는 별도 태스크.** 예: Phase 2 Task 02(Router hygiene), Task 04(쿼리 인덱싱) 처럼 단일 관심사로 묶어서 진행.
4. **측정 > 추측.** "이게 느릴 것 같다" 이전에 로그/프로파일러로 확인하고 리팩토링.

---

## §8. 실제 적용 사례

### 사례 1 — Vite proxy 전환 (2026-04-18)

**증상**: 공인 IP로 프론트 외부 배포 시 CORS 에러. `.env.local`에 공인 IP 박고 `application-local.yml`의 `allowed-origins`에도 공인 IP 추가하는 식으로 처리했더니 하드코딩 포인트가 4곳(frontend env 2개 + backend yml 2개).

**원인**: 설정이 분산 + baseURL 절대 URL 의존.

**해결**:
- `vite.config.ts`에 `server.proxy` 설정 (main-site → :8080, admin-site → :8081).
- 프론트 API 호출을 상대경로(`/api/...`)로 일원화 (이미 구조는 있었음, baseURL만 `""`로).
- backend CORS 원상복구 (localhost만).

**효과**: IP 바뀌어도 수정 0곳. 하드코딩 4곳 → 0곳. CORS 걱정 삭제.

**교훈**: 하드코딩 냄새가 나면 "정말 외부 계약이 필요한가"부터 묻는다. dev 환경에서 same-origin으로 해결되는 문제가 많다.

---

### 사례 2 — CORS origin 하드코딩 → `allowedOriginPatterns` 전환 (2026-04-18)

**증상**: 사례 1 이후 공인 IP로 외부 PC에서 접속하니 인증 API 403. 브라우저가 `http://121.133.86.173:5173`에서 `/api/*`를 Vite proxy로 보냈고, proxy는 Origin 헤더를 그대로 backend에 전달. Spring Security CORS의 `allowedOrigins` 리스트에 해당 Origin이 없어 reject.

**원인**: `fsm.cors.allowed-origins` 가 정적 리스트(localhost 외 특정 IP들)였음. 새 호스트가 붙을 때마다 yml 수정 + backend 재시작 필요 → 하드코딩 슬금슬금 누적.

**1차 시도 (꼼수, 롤백)**: Vite proxy `configure` 콜백에서 Origin 헤더 `removeHeader("origin")`. 브라우저 입장에선 same-origin이지만 서버가 CORS를 우회하게 만드는 방식. 하드코딩은 없어졌지만 정책 검증 자체를 skip하는 형태라 근본 해법 아님.

**2차 (근본)**:
- `CorsConfiguration.allowedOrigins` → `allowedOriginPatterns` 전환. credentials=true에서도 wildcard pattern 허용.
- 기본값 `http://*:5173,http://*:5174` (코드 내 `@Value` default). 개발 포트는 고정, 호스트는 자유.
- `application-local.yml` 의 `fsm.cors.*` 섹션 **완전 삭제**. 기본값으로 충분.
- Vite proxy의 `configure` 콜백 롤백 → 단순 proxy만.

**검증**:
- 공인 IP:5173/5174 — 로그인 + 12개 역할별 endpoint 200
- pattern 비매칭 포트(`http://evil.com:9999`) → 403 정상 거부
- 브라우저는 same-origin이라 preflight 자체 안 보내고, 실제 요청의 Origin만 backend가 pattern matching

**효과**: 호스트 바뀌어도 수정 0곳. yml의 CORS 섹션 사라짐. 보안 정책 우회 아닌 "명시적 허용" 유지.

**교훈**:
1. 하드코딩 제거를 위해 보안 검증을 **우회**하는 방향은 피한다. 대신 검증 로직이 **유연한 형태**로 표현되도록 바꾼다 (pattern, regex, wildcard).
2. "빠른 fix"와 "근본 fix" 중 빠른 fix만 집어넣고 커밋하지 말 것. 리뷰어는 꼼수를 잘 못 잡는다.
3. Spring Security는 `allowedOrigins`(정확 매치)와 `allowedOriginPatterns`(wildcard/credential 호환)가 다른 필드. credential 쓰는 앱은 patterns가 사실상 정답.

---

### 사례 3 — Mongo seed 누락 → 재시드 규약 명시화 (2026-04-19)

**증상**: supplier 가 `POST /api/requests/{id}/quotes` (견적 제출) 호출 시 HTTP 200 + 바디 `code: 5000 / message: "Failed to instantiate RequesterRequestSummaryDocument ... requesterUserId null"`. 모든 open 의뢰에서 일관 재현.

**원인**: Mongo volume (`backend_mongodb-data`) 이 persisted 된 상태에서 seed 스크립트 (`02-seed-read-models.js`) 만 업데이트되고 **재실행되지 않음**. `docker-entrypoint-initdb.d/` 는 컨테이너 초기화 시 한 번만 실행. 결과적으로 `requester_request_summary_view` 문서에 후에 추가된 `requesterUserId`, `updatedAt` 필드가 누락된 상태로 남음 → Kotlin data class 생성자가 non-null `String` 기대하나 null 이 넘어와 500.

스크립트 자체는 이미 idempotent 했음 (`_id: /seed_/` deleteMany + re-insert). 코드 변경 불필요.

**조치**: `./scripts/local/seed-mongodb.sh` 수동 실행 → seed 복구 → 견적 제출 flow 200. 운영 규약 한 단락을 `LOCAL-RUN-GUIDE.ko.md §6` 에 추가 ("시드 파일 수정 시 반드시 재시드" + 체크 포인트).

**교훈**:
1. **Init-once 스크립트를 수정했다면 "자동 재실행" 을 기대하지 말 것.** Docker `initdb.d` / DB 마이그레이션 등 일회성 초기화 메커니즘은 수정해도 기존 상태를 덮지 않는다.
2. **스크립트의 멱등성 != 자동 적용**. "다시 돌리면 같은 결과" 라는 것은 운영자가 명시적으로 돌릴 때의 이야기. 재실행 조건을 운영 문서에 명시해야 한다.
3. **에러 스택에서 "생성자 인스턴스화 실패 + null 필드" 는 schema-code drift 를 의심하는 신호**. 최근 코드/DTO 변경이 있었는지 + seed 가 최신인지 둘 다 체크.

---

### 사례 4 — SupplierQueryService in-memory filter/sort → Mongo Criteria 이관 (2026-04-19, Task 04)

**증상**: `/api/suppliers?keyword=...&category=...&sort=...&page=...` 가 `supplierSearchViewRepository.findAll().collectList()` 로 **전체 문서** 를 끌어온 뒤 Kotlin `asSequence().filter{}.sortedBy{}.subList()` 로 메모리에서 처리. 현재 seed 3~8건이라 느리진 않으나 구조가 지침서 §3 위반 (DB 기능을 앱에서 흉내).

**원인**: 초기 구현 시점에 필터 조합이 복잡 (keyword/category/region/oem/odm/numeric) 해서 Mongo pipeline 설계를 뒤로 미룸. 이후 categories/regions 집계만 `@Aggregation` 으로 옮기고 `listApproved` 는 방치.

**조치**:
- `ReactiveMongoTemplate` + `Criteria.andOperator(...)` + `Query.with(Sort).skip/limit` 로 재작성. keyword/category/region/oem/odm 은 DB-side, 정렬 (`updatedAt`/`companyName`/`monthlyCapacity`/`moq`) 도 DB-side, 페이지네이션도 Mongo `skip/limit`.
- `supplier_search_view` 에 인덱스 7종 정의 (`01-init-read-store.js` 에 `createIndex`, idempotent). `seed-mongodb.sh` 가 `01` + `02` 둘 다 실행하도록 수정.
- 남은 한계: `monthlyCapacity`/`moq` 가 자유 텍스트 ("1,000kg") 이므로 `minCapacity`/`maxMoq` 는 페이지 내 post-filter 로만 동작. 숫자 필드 정규화는 open-item BE-4 로 분리.

**교훈**:
1. **"데이터 적어서 괜찮다"는 구조 부채를 정당화하지 않는다**. Mongo 3건에서도 컨벤션이 어긋나면 팀원이 그 패턴을 복붙한다. 부채 가시화 (open-items) + 착수 (Task) 분리가 핵심.
2. **모든 필터를 한 번에 DB-side 로 옮기려 하지 말 것**. 자유 텍스트 필드처럼 DB 로 못 옮기는 것은 post-filter 로 남기고 **분리해서 문서화**. 무리하게 정규식 파싱을 Mongo 로 밀어넣으면 성능도 가독성도 악화.
3. **인덱스는 init 스크립트 한 파일에 집중**. annotation 기반 auto-creation 은 운영 예측성이 떨어짐. 재시드 규약 (사례 3) 과 연계되어 있어야 현장에서 동작.

---

### 사례 5 — OpenAPI 글로벌 `bearerAuth` 로 공개 endpoint 에 자물쇠 오표시 (2026-04-19, Task 05)

**증상**: Swagger UI 에서 `/api/auth/login`, `/api/notices`, `/api/suppliers` 같은 **공개** endpoint 에 자물쇠 아이콘이 붙어 "JWT 필요" 로 보임. 실제 Spring Security 설정은 anonymous 허용이라 실행은 정상이나, 문서 계약이 틀림.

**원인**: `ApiOpenApiConfig` / `AdminOpenApiConfig` 가 `.addSecurityItem(SecurityRequirement().addList("bearerAuth"))` 를 **전역** 에 적용. 개별 controller 는 이미 `@SecurityRequirement(name = "bearerAuth")` 를 필요한 곳에 선언했지만, 전역 security 는 모든 operation 에 기본값으로 상속되어 제거 불가. 외부 개발자가 공개 API 를 호출하려 할 때 "로그인부터 해야 하나?" 로 오해.

**조치**:
- 두 Config 에서 전역 `addSecurityItem` 제거.
- 공개 controller (auth, notices, supplier discovery, swagger-ui) 는 @SecurityRequirement 없음 → 자물쇠 표시 안 됨.
- 인증 필요 controller 는 기존 `@SecurityRequirement` 그대로 → 정확히 그 operation 에만 자물쇠 표시.
- 덤으로 `ApiErrorResponse` 스키마 정확화 (`errors[]` 배열, traceId) + 도메인 exception code 기반 reusable examples 7종 등록. AdminReview action 3종 (`approve`/`hold`/`reject`) 에 `@Operation` + `@ApiResponses` 추가.

**검증**: api 36/47, admin 13/16 endpoint 에서 `per-op security` 존재, 나머지는 실제 public. Swagger UI 자물쇠 표시가 실제 정책과 일치.

**교훈**:
1. **글로벌 기본값 + 개별 override 패턴은 "없음" 을 표현할 수 없다**. OpenAPI 의 global `security` 는 operation 레벨에서 `security: []` 로 비우지 않는 한 상속됨. 차라리 전역을 비우고 필요한 곳마다 명시하는 편이 의도가 명확.
2. **"문서가 실제를 반영하지 않는다" 는 버그 수준 이슈**. 실행이 돌아간다고 무시하면 외부 consumer 가 엉뚱한 방향으로 구현. 계약 일관성은 기능 일관성만큼 중요.
3. **에러 envelope 예제는 실제 도메인 code 로 채워야 가치 있다**. 더미 4000/traceId-1234 는 readers 가 무시하지만, `code=4041 Request not found` / `code=4091 Email already exists` 처럼 실제 매핑을 넣으면 문서가 곧 cheatsheet 가 됨 (`shared-core/error/*.kt` 의 code 와 동기화).

---

### 사례 6 — `packages/utils` 의 `import.meta.env` 타입 누락으로 CI 가 조용히 red (2026-04-20)

**증상**: `frontend/packages/utils/src/index.ts` 가 `import.meta.env.VITE_API_BASE_URL` 를 쓰는데 `yarn type-check` (root, 전 워크스페이스) 실행 시 `TS2339: Property 'env' does not exist on type 'ImportMeta'`. 개별 앱 (`yarn workspace @fsm/main-site type-check`) 에서는 통과하므로 로컬 개발 중엔 드러나지 않음. Task 01 이후 `frontend-ci.yml` 이 `yarn type-check` 를 step 에 넣었지만 아무도 GitHub Actions 결과를 안 봐서 **9커밋 내내 CI red 방치**.

**원인**: `import.meta.env` 는 Vite client types (`vite/client`) 가 선언. apps/* 는 Vite 를 devDependency 로 쓰고 `tsconfig.json` 이 `@types/` 를 주워가지만, `packages/utils` 는 Vite 에 의존하지 않는 공용 패키지로 설계되어 `ImportMeta.env` 타입이 없음.

**조치**:
- `packages/utils/src/env.d.ts` 신규: 로컬 `ImportMetaEnv` + `ImportMeta` 인터페이스 선언 (VITE_API_BASE_URL, VITE_ADMIN_API_BASE_URL). Vite 의존성 추가 없이 타입 shape 만 내부에서 정의.
- CI 는 `462a43f` 에서 즉시 green.

**교훈**:
1. **모노레포 CI 는 "root-level 집계 명령" 을 기준으로 검증해야 한다**. 개별 워크스페이스만 테스트하면 workspace 간 타입 경계 문제가 누락. `yarn type-check` (`foreach -A -t`) 나 `./gradlew test` 같은 전사 명령을 CI 기본 step 으로.
2. **CI red 가 지속되면 경보로 인식해야 한다**. "CI YAML 이 존재 = green" 이 아니다. PR 머지 직전에 GitHub Actions 탭을 반드시 본다. 못 본다면 branch protection (OP-3) 이 필요.
3. **Vite-couple 된 공용 유틸은 shape 만이라도 명시**. `vite/client` 를 peer dependency 로 추가하는 건 과함. 작은 `env.d.ts` 로 패키지 내부 계약만 선언하면 `packages/utils` 의 독립성은 유지되고 타입 안전성도 확보.

---

### 사례 7 — 도메인 먼저, 계약 뒤 (계약 우선 위반) (2026-04-20, Task 06 SubTask 6.2)

**증상**: Phase 2 Task 06 Reviews & Ratings 착수 시 SubTask 6.2 (도메인 모델) 부터 구현 → `ReviewCommandService`, `ReviewEntity`, `ReviewRepository`, sealed exceptions, DDL 을 커밋 (`8be41f3`). 이 시점까지 `api-spec.md` 에는 Review 관련 섹션이 하나도 없음. 사용자 지적: "에이피아이 명세는 만들고 한거야? 명세서 먼저 만들었으면 좋겠네? 명세 만들고 명세 검증하고 그거에 대한 에이피아이를 만드는게 맞는거 같아."

**원인**: 지침서 §1 "계약 우선" (`api-spec.md` 를 먼저 맞추고 코드는 그에 맞춤) 을 인지했으나, 도메인 레이어는 HTTP 계약과 다르다고 착각하여 순서를 바꾸지 않음. 실제로는 command-service 의 signature (CreateReviewCommand 의 필드명 / 에러 sealed class 의 code 할당) 가 HTTP API 의 shape 와 error envelope 를 미리 결정해 버린다.

**조치**:
- 계약 소급 작성: §3.11 Review (api-server) + §4.4 admin supplier-reviews (admin-server) + §5.1 에러 코드 4031/4036/4094/4222 재의미 부여 (`1809069`, spec v1.6).
- 자체 검증에서 2건 결함 발견 → 수정 (`21dfb80`, v1.7): (1) POST body `supplierProfileId` → `supplierId` (외부 필드명 일관성), (2) GET 목록 페이지네이션이 §2.7 규약 위반.
- spec 과 domain code 의 대조 검증 매트릭스 작성. domain 은 이미 spec 과 일치한다는 결론 → 코드 수정 없음. 단 누락됐던 에러 404/4041 (RequestNotFound) 는 spec 에 추가.
- 이후 SubTask 6.3~6.8 은 모두 "spec 우선 → 검증 → 구현" 순서로 통일.

**교훈**:
1. **계약 우선은 "HTTP 계약" 에만 국한되지 않는다**. 도메인 command/query 메서드 signature, 에러 sealed class 의 code 할당, DDL 의 UNIQUE/FK 는 전부 외부 API 의 shape 를 굳히는 결정이다. 도메인부터 쓰면 나중에 계약에서 재할당이 필요해 비용이 더 커진다.
2. **spec 후작성도 "검증 + 수정" 사이클을 반드시 걸친다**. 계약과 구현이 "보기엔" 맞는 것 같아도 페이지네이션 규약, 외부 필드명 일관성 같은 디테일이 어긋나 있다. spec 작성 후 다른 endpoint 와 대조하는 자체 리뷰가 필수.
3. **에러 코드는 "빈 슬롯" 만 쓴다 ≠ 충분**. Phase 1 draft 의 예약 코드 (4031 Wrong role, 4036 Invalid supplier target 등) 가 실제 구현 없이 spec 에만 있었기 때문에 재의미 부여가 가능했지만, 만약 사용 중이었다면 domain 코드를 수정해야 했을 것. **spec ↔ code 정기 audit** 가 코드 재할당 비용을 예방한다 (DOC-2 해소, v1.9).

---

### 사례 8 — 동기 `throw` 가 `StepVerifier` 에서 포착되지 않는 결함 (2026-04-20, Task 06 SubTask 6.9)

**증상**: `ReviewCommandService.create` 와 `update` 메서드 시작에 `ensureContentAllowed(text)` 를 호출하여 금칙어가 있으면 `throw ReviewContentViolationException(...)` 하도록 구현. 프로덕션에서 curl 로 `rating=5 text="씨발 망했음"` 보내면 Spring WebFlux 가 정상적으로 `422 code=4222` 로 응답. 그러나 `StepVerifier.create(service.create(...)).expectErrorSatisfies { ... }.verify()` 형태의 단위 테스트는 **NPE** 로 깨짐. 원인은 테스트가 `requestRepository.findById("req_1")` 를 stub 하지 않았기 때문인데, 정상 흐름이라면 profanity check 에서 Mono.error 로 종료되어 findById 가 호출되지 않아야 함.

**원인**: `ensureContentAllowed` 가 동기 `throw` 를 하면 `service.create(command)` 호출 자체가 Mono 를 반환하기 **전에** 예외가 던져짐. Reactor 체인 (`requestRepository.findById(command.requestId).switchIfEmpty(...)`) 은 체인 구성 시점에 평가되는 반면, StepVerifier 는 Mono 가 정상 반환된 이후 emission 을 기다리기 때문에 동기 throw 를 포착하지 못함. 결과적으로 Kotlin 에서는 Mono 를 `.then(x)` 로 연결할 때 `x` 가 먼저 평가되어 null stub 에서 NPE 발생.

**조치**:
- `ensureContentAllowed` 를 `Mono<Void>` 반환으로 변경 (profanity 면 `Mono.error`, 아니면 `Mono.empty`).
- 후속 체인을 `.then(Mono.defer { ... })` 로 감싸 lazy 평가. profanity error 시 defer 블록은 실행되지 않음.
- 테스트 13건 전부 통과 (SubTask 6.9 evidence 참고).

**교훈**:
1. **reactive 메서드는 어떤 경우에도 동기 throw 하지 않는다**. validation 조차 `Mono.error` 로 표현해야 Reactor pipeline 의 취소/fallback/retry 연산자와 호환된다. Spring WebFlux 가 외부에서 catch 해 주는 것에 의존하지 말 것.
2. **`.then(expr)` 의 `expr` 은 eager 평가된다**. 앞 단계의 에러로 skip 되기를 원하면 `.then(Mono.defer { expr })` 로 lazy 하게 만든다. `flatMap` 은 자연스럽게 lazy 하지만 `then` 은 아니다.
3. **프로덕션에서 보이지 않는 버그를 단위 테스트가 잡는다**. WebFlux 의 `Dispatcher` 가 sync throw 를 catch 하는 너그러움이 오히려 결함을 숨긴다. domain 레이어 단위 테스트는 reactive contract 를 엄격히 지키는 검증 기준이 된다.

---

### 사례 10 — CQRS 롤백: 과잉 설계의 흔적 청산 (2026-04-22~24, Phase 3 Task A)

**증상 / 문제 상황**:
- Phase 1 부터 MariaDB (command) + MongoDB (read view) 2-store CQRS 로 설계. read view 는 projection service 들이 command write 후 비동기로 동기화.
- 운영 6개월 후 누적 부채:
  - **정합성 리스크 상시**: supplier verification_state 변경 시 Mongo supplier_search_view 갱신 누락 → "승인했는데 목록에 안 나옴" 류 이슈 반복.
  - **seed/코드 드리프트**: supplier_profile.exposure_state 가 seed 에선 `'listed'`, 코드 canonical 은 `'visible'`. Mongo 쿼리가 이 필드를 필터링하지 않았기에 seed 데이터가 그대로 노출되어 버그가 가려짐. R2DBC 로 전환하며 비로소 드러남.
  - **쓰기 팬아웃**: 하나의 command 가 command repository + 여러 projection repository 에 write. 실패 시 compensation 없음.
  - **미래 도입 가치 낮음**: FSM 은 B2B 트랜잭션 시스템. 대용량 검색 / 피드 / 실시간 스트림 / OLAP 대시보드 없음. Mongo 가 제공하는 유연 스키마 / 샤딩 이점을 실제로 쓰는 query 가 0.
- 즉, **CQRS 로 얻는 이익 < CQRS 로 발생하는 부채**.

**원인**:
1. **YAGNI 위반**. 초기 설계 단계에 "미래에 성능 병목이 생길 수 있으니 분리해 두자" 가 내려진 결정. 실측 없이 "대비" 만으로 도입한 아키텍처.
2. **"CQRS 는 중립" 이라는 착각**. 두 저장소 병행은 "선택지를 열어둔다" 기보다 "매 command 마다 dual-write 부담" 이라는 비용으로 귀결된다. 중립이 아니라 **명백한 tradeoff 측**.
3. **적합 도구 오인식**. 복잡 검색이 필요하면 Elasticsearch, 분석이 필요하면 OLAP DB 가 정답. Mongo 는 "유연 스키마 저장소" 이지 "만능 query DB" 가 아니다.

**조치** (Phase 3 Task A, 8 stage, 9 commits):
- **Stage 1 (subplan)**: 7 모듈 + 7 projection 서비스 + 14개 쿼리 서비스 인벤토리. 단계별 rollback 순서 고정.
- **Stage 2~7** (도메인별 R2DBC 전환):
  - Supplier / Request / Quote / Thread / User / Notice / Admin Review 의 read path 를 MariaDB 직접 조회로 재작성.
  - 각 도메인에서 "신규 R2DBC query service 작성 → controller 재배선 → 해당 projection 호출 제거" 를 한 commit 에 완결. **절대 Mongo/R2DBC dual-read 윈도우를 남기지 않는다**. projection 은 stage 경계에서 즉시 호출 제거.
  - 복잡 필터 / join / subquery 는 `DatabaseClient` 로 raw SQL 작성 (Supplier CSV `FIND_IN_SET`, Request quote_count COALESCE 서브쿼리, Quote thread_id LEFT JOIN, AdminReview verification_submission JOIN supplier_profile).
  - 단순 조회는 기존 command repository 재사용 (`BusinessProfileRepository.findByUserAccountId`, `MessageRepository.countByThreadIdAnd…`).
  - DTO shape 불변. frontend 완전 무변경.
- **Stage 8 (물리 제거)**:
  - 8개 모듈 (`projection/`, `query-model-user/…/admin-stats/`) 디렉토리 삭제, `settings.gradle.kts` include 제거.
  - `spring-boot-starter-data-mongodb-reactive` 의존 제거, `@EnableReactiveMongoRepositories` 삭제.
  - `application.yml` / `application-local.yml` / test yml 에서 `spring.mongodb` + `management.health.mongo` 제거.
  - `compose.local.mongodb.yml` / `docker/mongodb/` / `init-mongodb.sh` / `seed-mongodb.sh` 삭제, `seed-all.sh` 단순화.
  - `.github/workflows/backend-ci.yml` mongodb service + init/seed step 제거.
  - `docker stop / rm` Mongo 컨테이너. `LOCAL-RUN-GUIDE.ko.md` 전면 정리.
- 검증: `./gradlew test` 전 모듈 green, health `r2dbc` 만 UP, end-to-end 19 endpoint HTTP 200, 이전 FE 회귀 0건.

**효과**:
- 75 files changed, 2099 lines deleted (Stage 8 단독). 도메인 stage 평균 ~300 LOC 교체.
- 정합성 리스크 전면 소멸 (single source of truth).
- 빌드/CI/로컬 기동 1 step 단축.
- 드리프트 수정 (`exposure_state 'listed' → 'visible'`) 이 부수효과로 잡힘.

**교훈**:
1. **CQRS / 복잡 아키텍처는 "측정된 문제" 에 대해서만 도입한다**. "미래 대비" 로 도입하면 대부분 부채만 쌓인다. YAGNI 는 기능뿐 아니라 아키텍처에도 적용된다.
2. **롤백은 stage 단위로 완결시킨다**. dual-read 윈도우 / 부분 전환 / 임시 플래그는 리스크를 늘린다. 각 stage 에서 "이 도메인은 Mongo 를 더 이상 읽지도 쓰지도 않는다" 가 완결되어야 다음 stage 로 간다.
3. **드리프트는 단일 저장소로 수렴할 때 드러난다**. 2-store 체제는 한쪽이 한쪽을 가리는 경우가 많고 (projection 필터 로직 vs seed 데이터), 단일화 과정에서 자연스럽게 정상화된다.
4. **적합 도구는 필요할 때 별도 도입**. 검색 고도화가 실제로 필요해지면 Elasticsearch 를 그때 붙이면 된다. "언젠가 쓸 것 같다" 는 MongoDB 를 안고 가는 근거가 아니다.
5. **DTO shape 보존은 롤백의 안전선이다**. 응답 shape 가 동일하면 frontend 무변경 → rollback 이 백엔드 내부 일로 국한된다. 계약이 바뀌지 않도록 응답 mapping 단에서 shape 고정.

---

### 사례 9 — UPnP 매핑의 휘발성 (2026-04-20, Infra)

**증상**: `miniupnpc` (`upnpc -a 172.30.1.81 5173 5173 TCP 0`) 로 4 포트 매핑 등록 후 외부 접속 OK. 세션 뒤 사용자 시도 시 전부 timeout. `upnpc -l` 결과 매핑 0건.

**원인**: UPnP IGD 는 본질적으로 "임시" 성격. 다수의 공유기가 UPnP 매핑을 NVRAM 이 아닌 RAM 에 저장하거나 짧은 기본 lease 로 관리. 공유기 재부팅 / Mac sleep / UPnP 상태 갱신 이벤트에서 쉽게 초기화됨. lease 를 `0` (무기한) 으로 설정해도 공유기 내부 로직상 유지를 보장하지 않음.

**조치**:
- 즉시: `upnpc -a` 4줄 재등록 (휘발성 인정).
- 영구: 공유기 관리자 페이지에서 **정적 포트 포워딩** + **DHCP 예약 (Mac IP 고정)** 필요. `EXTERNAL-ACCESS-GUIDE.ko.md` 에 제조사별 메뉴 경로 / 검증 curl / 트러블슈팅 체크리스트 포함.
- 외부 포트 8080 은 ISP 레벨에서 차단되는 경우가 많아 18080 같은 bypass 포트로 우회 (api-server 만 해당, admin-server 8081 은 OK).

**교훈**:
1. **UPnP 는 MVP / 데모용 임시 해결책**. 프로덕션이나 지속적 외부 테스트에는 정적 포워딩이 정답. 자동화 (launchd 부팅 시 upnpc 재실행 등) 는 공유기 재부팅 대응이 약해서 완전 대체가 안 된다.
2. **hairpin NAT 미지원 공유기는 내부에서 공인 IP 로 쏘면 실패한다**. 반드시 외부 네트워크 (LTE 연결 폰 등) 에서 최종 검증해야 포워딩 유효성을 확신할 수 있다.
3. **ISP 가 well-known 포트 (80/8080/443) 를 차단하는 경우 대비**. 외부 포트는 숫자를 겹치지 않게 가져가고 (`18080`), 내부 포트만 표준으로 둔다. 문서화하지 않으면 DevOps 가 "왜 8080 은 안 되는지" 추적에 시간 소모.

---

## §9. 관련 문서

- `api-spec.md` — API 계약의 SSOT.
- `docs/TEST-GUIDE.md` — 테스트 전략 상세.
- `.sisyphus/plans/phase2-subplans/` — Phase 2 task 단위 계획.
- `LOCAL-RUN-GUIDE.ko.md` — 로컬 환경 기동.

---

## §10. Document History

| 버전 | 날짜 | 변경 |
|------|------|------|
| 1.0 | 2026-04-18 | 초판. Phase 2 진입 시점 원칙 정리. |
| 1.1 | 2026-04-18 | §8 사례 2 추가: CORS `allowedOriginPatterns` 전환 (하드코딩 제거 근본 해결). |
| 1.2 | 2026-04-18 | §2.5에 Query Key Factory 규약 추가. 리터럴 queryKey 금지, feature별 factory 강제. |
| 1.3 | 2026-04-19 | §2.6 강화: 정적 style 값은 utility class 우선, 동적만 인라인 허용. |
| 1.4 | 2026-04-19 | §2.9 강화: 사용자 가시 텍스트는 i18n 리소스 강제, useTranslation + namespace 규약 명시. |
| 1.5 | 2026-04-19 | §2.5.2 추가: AsyncBoundary 로 loading/error/empty 패턴 공통화. |
| 1.6 | 2026-04-19 | §8 사례 3 추가: Mongo seed 누락 → 재시드 규약 운영 문서화 (LOCAL-RUN-GUIDE.ko.md §6). |
| 1.7 | 2026-04-20 | §8 사례 4~6 추가: Supplier search Mongo Criteria 이관 (Task 04), OpenAPI 글로벌 security 제거 (Task 05), `packages/utils` env.d.ts 로 CI red 복구. |
| 1.8 | 2026-04-20 | §8 사례 7~9 추가 (Task 06 & Infra): 계약 우선 위반 후 소급 작성 + 대조 검증 (spec v1.6~1.9), reactive service 의 동기 throw 와 `Mono.defer` 패턴, UPnP 휘발성 과 정적 포워딩 필요성. |
| 1.9 | 2026-04-24 | §8 사례 10 추가 (Phase 3 Task A): CQRS 전면 롤백. 8 stage 로 Mongo 완전 제거 + 단일 MariaDB R2DBC 전환. YAGNI / dual-read 금지 / 드리프트 수렴 / DTO shape 보존. |
