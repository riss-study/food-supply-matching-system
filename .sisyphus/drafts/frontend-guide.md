# Frontend Guide

> 상태: Active Guide
> 기준 문서: `system-architecture.md`, `api-spec.md`, `design-system.md`

---

## 1. 목적

이 문서는 Phase 1 프론트엔드 구현자가 따라야 할 개발 기준을 정리한다.

- 구조 기준은 `system-architecture.md`
- API 계약 기준은 `api-spec.md`
- 시각 규칙 기준은 `design-system.md`

---

## 2. 프론트엔드 기술 스택

| 항목 | 선택 | 설명 |
|------|------|------|
| 언어 | TypeScript | 기본 구현 언어 |
| 프레임워크 | React | 기본 UI 프레임워크 |
| 빌드 도구 | Vite | 앱 번들링 |
| 패키지 매니저 | Yarn 4.5.0 (Berry) | workspace 관리 |
| 모노레포 | Yarn Workspaces | apps + packages 구조 |
| 라우팅 | React Router | route 관리 |
| 서버 상태 | TanStack Query | API cache/fetch |
| 클라이언트 상태 | Zustand | UI/local state |
| 스타일링 | 순수 CSS 클래스 시스템 | CSS custom properties + utility classes (index.css) |
| 폰트 | Inter | 깔끔한 B2B 톤 기준 |
| 다국어 | i18next | 국제화 |
| 애니메이션 | Lottie-web | JSON animation baseline |
| HTTP | axios | API client |
| 날짜 | dayjs | date utility |
| 기타 유틸 | lodash-es | functional utility |

---

## 3. 저장소 구조

```text
frontend/
├── apps/
│   ├── main-site
│   └── admin-site
└── packages/
    ├── ui
    ├── types
    ├── utils
    └── config
```

현재 기준 워크스페이스 수는 6개다.

---

## 4. 앱 경계

### main-site

- 요청자/공급자 대상 메인 서비스 사이트
- 역할별 진입과 IA는 앱 내부에서 분리
- 공개 탐색, 공급자 상세, 의뢰, 견적, 메시지, 공지 소비 담당

### admin-site

- 관리자 검수/운영/공지/통계 전용 사이트
- 메인 사이트 hidden mode로 구현하지 않는다.

### 4.1 주요 내비게이션

#### requester

- 대시보드
- 공급자
- 의뢰
- 견적
- 메시지
- 계정

#### supplier

- 대시보드
- 프로필
- 검수
- 의뢰
- 견적
- 메시지
- 계정

#### admin

사이드바에는 3개 메뉴만 존재한다:

- 업체 검수
- 공지 관리
- 통계

### 4.2 핵심 화면-모델 매핑

| 화면 | 사용자 | 주요 객체 |
|------|--------|-----------|
| 랜딩 | 공개 | Notice / SupplierPreview |
| 공급자 검색 | 공개 / 요청자 | SupplierSearchView |
| 공급자 상세 | 공개 / 요청자 | SupplierProfileReadModel |
| 의뢰 생성 / 수정 | 요청자 | Request |
| 의뢰 상세 | 요청자 / 공급자 | Request |
| 견적 비교 | 요청자 | QuoteCollection |
| 견적 작성 | 공급자 | Quote |
| 스레드 목록 | 요청자 / 공급자 | MessageThreadSummary |
| 스레드 상세 | 요청자 / 공급자 | MessageThread |
| 검수 제출 | 공급자 | VerificationSubmission |
| 검수 큐 | 관리자 | AdminReviewItem |
| 검수 상세 | 관리자 | VerificationSubmission |
| 공지 목록/상세 (split view) | 요청자 / 공급자 / 공개 | Notice (NoticeListDetailPage) |
| 공지 관리 | 관리자 | Notice |
| 통계 대시보드 | 관리자 | PlatformStatSummary |

### 4.3 핵심 사용자 흐름

#### Flow A: 공급자 검수

- 공급자가 프로필과 서류를 제출한다.
- 관리자가 제출 건을 검토하고 승인 / 보류 / 반려한다.
- 결과는 공급자 노출과 견적 참여 가능 여부에 직접 영향을 준다.

#### Flow B: 의뢰 등록

- 요청자는 사업자 승인 후 의뢰를 생성 / 수정 / 게시할 수 있다.
- 의뢰 모드는 `public`과 `targeted`를 분명히 구분한다.

#### Flow C: 견적 제출 및 비교

- 승인된 공급자만 `open` 의뢰에 견적을 제출할 수 있다.
- 요청자는 여러 견적을 비교하고 후속 진행 대상을 선택할 수 있다.

#### Flow D: 메시지와 연락처 공유

- 스레드는 첫 견적 제출 또는 요청자 상담 시작으로 생성 가능하다.
- 연락처는 상호 동의 완료 전까지 숨겨야 한다.

#### Flow E: 관리자 검수 및 공지 운영

- 관리자는 검수 큐를 필터링하고 검수 결정을 수행한다.
- 관리자 공지와 기본 통계는 admin-site의 핵심 운영 surface다.

---

## 5. 공통 패키지 역할

### packages/ui

- 공통 UI 컴포넌트
- 토큰 연결 컴포넌트
- layout primitive

### packages/types

- API DTO type
- view model type
- shared enum / state type

### packages/utils

- axios client wrapper
- query helper
- format / date / utility

### packages/config

- Vite 공통 설정
- lint / format / tsconfig preset

---

## 6. 상태 관리 규칙

### TanStack Query

- 서버 상태 전용
- fetch / cache / invalidation / refetch 담당

### Zustand

- 클라이언트 상태 전용
- modal / filter UI / transient state / local preference 담당

규칙:

- API 응답 자체를 Zustand source of truth로 복제하지 않는다.
- 서버 상태는 가능하면 Query cache를 신뢰한다.

---

## 7. 스타일링 규칙

### 순수 CSS 클래스 시스템

- 디자인 토큰은 `packages/ui/src/shared.css`의 `:root` CSS custom properties에 정의
- 각 사이트 `index.css`는 `@import "@fsm/ui/src/shared.css"`로 공유 토큰을 가져옴
- 공통 utility class로 버튼, 카드, 배지, 입력, 레이아웃 등 구성
- 상태 기반 스타일은 CSS class 조합으로 처리

주요 레이아웃 클래스 (olive/khaki 리디자인 기준):

- `section-title`, `home-section-title`: 섹션 제목
- `two-col-sidebar-l` / `two-col-sidebar-r`: 사이드바 레이아웃
- `two-col-master-detail`: 목록/상세 split view (공지 등)
- `supplier-hero`: 공급자 상세 히어로
- `thread-layout`: 메시지 채팅 레이아웃
- `empty-state`: 빈 상태 (모든 list/table 페이지에 적용)
- `auth-layout-*`: 로그인/회원가입 split 레이아웃

규칙:

- CSS custom properties (:root)를 통해 토큰을 일관되게 유지한다.
- 공통 컴포넌트는 먼저 `packages/ui`로 올릴 수 있는지 검토한다.
- 인라인 스타일을 남용하지 않고, 공통 클래스를 우선 사용한다.

### 401 자동 로그아웃

- 양쪽 사이트(main-site, admin-site) 모두 axios interceptor에서 401 응답 시 자동으로 인증 상태를 초기화하고 로그인 페이지로 리다이렉트한다.

---

## 8. 라우팅 규칙

- `main-site`와 `admin-site`는 별도 엔트리/라우터를 가진다.
- 관리자 화면을 메인 앱 내부 숨김 route로 우회하지 않는다.
- route guard와 auth state는 app 성격에 따라 분리한다.

---

## 9. UI / 노출 규칙

- 공개 사용자는 탐색만 가능하고 거래 행동은 할 수 없다.
- 공급자 신뢰 상태는 리스트와 상세 모두에서 보여야 한다.
- 의뢰 모드는 `public`과 `targeted`가 분명히 구분되어야 한다.
- 연락처는 상호 동의 전까지 숨겨야 한다.
- 관리자 검수 상태는 공급자 UI에 반영하되, internal note는 노출하면 안 된다.

---

## 10. 데이터 연동 기준

- `main-site`는 `api-server`와 연동한다.
- `admin-site`는 `admin-server`와 연동한다.
- DTO와 상태 enum은 `packages/types`에서 공유할 수 있다.
- internal review note 같은 admin 전용 필드는 메인 앱 type surface에 섞지 않는다.

---

## 11. 구현 시 금지사항

- admin UI를 `main-site` hidden mode로 넣는 것
- 동일한 UI/타입/유틸을 앱마다 복붙하는 것
- 서버 상태를 Zustand에 재저장해서 이중 source of truth 만드는 것
- CSS custom properties 체계를 무시하고 인라인 스타일을 남용하는 것

---

## 12. 읽는 순서

1. `system-architecture.md`
2. `api-spec.md`
3. `design-system.md`
4. 이 문서
