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
| 스타일링 | Emotion | dynamic/theme style |
| UI 컴포넌트 | Radix UI + Tailwind | primitive + utility styling |
| 폰트 | Noto Sans JP | KR/JP 지원 기준 |
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

- 검수 큐
- 공급자
- 요청자
- 공지
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
| 공지 목록 / 편집 | 관리자 | Notice |
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

### Radix UI

- 접근성 기반 primitive/component foundation

### Tailwind

- layout, spacing, responsive utility, 빠른 화면 조합 담당

### Emotion

- theme token binding
- component-level dynamic styling
- Tailwind로 다루기 불편한 상태 기반 스타일 담당

규칙:

- 같은 컴포넌트 안에서 Tailwind와 Emotion을 무분별하게 섞지 않는다.
- 공통 컴포넌트는 먼저 `packages/ui`로 올릴 수 있는지 검토한다.
- Radix primitive 위에 Tailwind / Emotion 역할 분담을 분명히 한다.

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
- Tailwind / Emotion 혼용 규칙 없이 임의로 스타일 레이어를 늘리는 것

---

## 12. 읽는 순서

1. `system-architecture.md`
2. `api-spec.md`
3. `design-system.md`
4. 이 문서
