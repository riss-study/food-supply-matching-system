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
