# UI 리디자인 우선순위 계획

Date: 2026-03-26
Status: Completed (2026-04-02 전면 적용 완료)

## 적용 현황 메모

- 2026-03-27 기준 1차 반영 완료:
  - main-site 공통 shell
  - main-site 로그인 / 회원가입
  - main-site 공급자 탐색 / 내 의뢰 목록 / 의뢰 상세 / 견적 비교 / 대화 상세 / 공지 목록
- admin-site 공통 shell
- admin-site 로그인 / 검수 큐 / 검수 상세 / 공지 관리 / 통계 대시보드
- main-site 보조 화면 정리 완료:
  - 공급자 상세
  - 사업자 정보
  - 공급자 의뢰 피드 / 상세
  - 공지 상세
- main-site 입력/관리형 화면 정리 완료:
  - 공급자 프로필 / 검수 제출
  - 견적 제출
  - 내 견적 관리
- 아직 남은 후속 정리 후보:
  - 공통 컴포넌트화 수준 추가 정리

## 1. 목적

이 문서는 현재 제품 UI를 어떤 순서로 개선해야 가장 큰 체감 효과를 얻을 수 있는지 정리한 우선순위 계획이다.

핵심 기준은 아래 네 가지다.

- 사용자 가치가 큰가
- 사용 빈도가 높은가
- 여러 화면에 공통으로 영향을 주는가
- 비교적 적은 수정으로 큰 체감 개선이 가능한가

---

## 2. 우선순위 기준

### 1순위 기준

- 서비스의 핵심 거래 흐름에 직접 연결된 화면
- 사용자가 자주 머무는 화면
- 디자인 개선 시 다른 화면에도 재사용 가능한 공통 블록을 만들 수 있는 화면

### 2순위 기준

- 운영 효율을 높이는 관리자 화면
- 정보 전달 성격이 강하지만 브랜드 신뢰에 영향을 주는 화면

### 3순위 기준

- 기능은 중요하지만 사용 빈도가 상대적으로 낮은 보조 화면

---

## 3. 리디자인 우선순위

## P0. 공통 스타일 시스템 정비

대상:

- `frontend/apps/main-site/src/index.css`
- `frontend/apps/main-site/src/App.css`
- `frontend/apps/admin-site/src/index.css`
- `frontend/apps/admin-site/src/App.css`

해야 할 일:

- 색상 토큰 정리
- 타이포 체계 정리
- 공통 여백 / 반경 / 그림자 / 테두리 규칙 정리
- 버튼 / 카드 / 입력창 / 테이블의 공통 기본형 정의

이유:

- 이걸 먼저 하지 않으면 뒤 화면을 아무리 고쳐도 다시 흩어진다.

## P1. main-site 핵심 거래 흐름

### 1순위 화면 묶음

- `frontend/apps/main-site/src/features/discovery/pages/SupplierSearchPage.tsx`
- `frontend/apps/main-site/src/features/request-management/pages/RequestDetailPage.tsx`
- `frontend/apps/main-site/src/features/quotes/pages/QuoteComparisonPage.tsx`
- `frontend/apps/main-site/src/features/threads/pages/ThreadDetailPage.tsx`

왜 먼저인가:

- 이 화면들이 실제 서비스의 핵심 가치와 직결된다.
- “공급자를 찾고 -> 의뢰를 보고 -> 견적을 비교하고 -> 상담한다”는 흐름이 바로 제품의 본체다.
- 여기서 신뢰감이 생겨야 서비스가 살아난다.

기대 효과:

- 제품 인상이 가장 크게 달라짐
- 사용자 입장에서 “서비스다워졌다”는 느낌이 바로 남음

## P2. admin-site 핵심 운영 흐름

대상:

- `frontend/apps/admin-site/src/features/reviews/pages/ReviewQueuePage.tsx`
- `frontend/apps/admin-site/src/features/stats/pages/StatsDashboardPage.tsx`
- `frontend/apps/admin-site/src/features/notices/pages/NoticeListPage.tsx`

왜 다음인가:

- 운영자가 빠르게 판단해야 하는 화면이기 때문
- 내부 도구는 화려함보다 “빠른 판단”이 중요하다

기대 효과:

- 운영 효율 향상
- 검수/공지/통계 관리가 더 명확해짐

## P3. main-site 정보성 / 보조 화면

대상:

- `frontend/apps/main-site/src/features/notices/pages/NoticeListPage.tsx`
- `frontend/apps/main-site/src/features/notices/pages/NoticeDetailPage.tsx`
- `frontend/apps/main-site/src/features/request-management/pages/RequestListPage.tsx`
- `frontend/apps/main-site/src/features/supplier-quotes/pages/SupplierQuoteListPage.tsx`

왜 나중인가:

- 중요하지만 제품의 첫인상을 가장 크게 좌우하는 화면은 아님
- 앞 단계에서 만든 공통 카드/테이블/헤더 컴포넌트를 재사용하면 효율적으로 정리 가능

---

## 4. 실제 구현 권장 순서

### Step 1

공통 스타일 토큰 + 공통 shell + 공통 card/button/input/table 정리

### Step 2

main-site 핵심 4개 화면 리디자인

- 공급자 탐색
- 의뢰 상세
- 견적 비교
- 대화 상세

### Step 3

admin-site 핵심 3개 화면 리디자인

- 검수 큐
- 통계 대시보드
- 공지 관리

### Step 4

정보성/보조 화면 정리

---

## 5. 이번 리디자인에서 만들면 좋은 공통 블록

- top navigation / app shell
- section header
- summary card
- status badge
- primary / secondary / danger button
- filter panel
- data table wrapper
- empty state block
- panel / drawer / dialog visual language

이 블록이 먼저 잡히면 이후 화면 개선 속도가 빨라진다.

---

## 6. 이번 작업에서 추천하는 실제 첫 구현 범위

가장 먼저 실제 손대기 좋은 범위는 아래다.

1. `main-site` 공통 shell 정리
2. `SupplierSearchPage`
3. `RequestDetailPage`
4. `QuoteComparisonPage`
5. `ThreadDetailPage`

이 조합이 좋은 이유:

- 하나의 사용자 여정으로 연결됨
- 모두 high-value screen임
- card, filter, table, action panel, dialog, message layout 같은 공통 디자인 자산을 동시에 만들 수 있음

---

## 7. 한 줄 결론

리디자인은 `예쁜 화면`부터가 아니라,

`공통 디자인 체계 -> 핵심 거래 흐름 -> 핵심 운영 흐름 -> 보조 화면`

순서로 들어가는 것이 가장 효율적이다.
