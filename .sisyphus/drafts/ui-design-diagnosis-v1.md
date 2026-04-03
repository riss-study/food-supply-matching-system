# UI 디자인 진단서 v1

> 상태: Archived (2026-04-02 전면 리디자인으로 해결됨)

Date: 2026-03-26
Status: Archived

## 1. 진단 목적

이 문서는 현재 `main-site`와 `admin-site` 화면 디자인이 왜 약하게 느껴지는지, 어떤 문제가 실제 사용성에 영향을 주는지, 그리고 어떤 순서로 개선하는 게 효율적인지를 정리한 진단 문서다.

핵심 결론부터 말하면, 현재 UI는 `기능 검증용 화면`으로는 충분하지만 `서비스 제품 화면`으로 보기에는 완성도가 낮다.

---

## 2. 전체 총평

현재 화면은 다음 문제를 공통으로 갖고 있다.

1. 공통 스타일 시스템이 거의 없다.
2. 정보 우선순위가 시각적으로 드러나지 않는다.
3. 인라인 스타일이 많아 화면 간 일관성이 약하다.
4. 핵심 행동 버튼이 “왜 지금 눌러야 하는지” 시각적으로 설득하지 못한다.
5. 제품 신뢰감을 주는 브랜드 톤이 부족하다.

즉, 지금 화면은 “개발 완료 화면”에 가깝고, “서비스 화면”으로 느껴지기엔 설계 밀도가 부족하다.

---

## 3. 공통 문제

## 3.1 스타일 시스템 부재

근거 파일:

- `frontend/apps/main-site/src/index.css`
- `frontend/apps/main-site/src/App.css`
- `frontend/apps/admin-site/src/index.css`
- `frontend/apps/admin-site/src/App.css`

문제:

- `index.css`는 사실상 배경색과 텍스트색만 있음
- `App.css`는 거의 Vite 기본 템플릿 상태
- 결과적으로 각 페이지가 공통 규칙 없이 직접 색/여백/버튼 모양을 정하고 있음

영향:

- 화면마다 다른 제품처럼 보임
- 유지보수 시 수정 포인트가 많아짐
- 디자인 개선을 하려 해도 재사용 기반이 약함

## 3.2 인라인 스타일 과다

대표 파일:

- `frontend/apps/main-site/src/features/discovery/pages/SupplierSearchPage.tsx`
- `frontend/apps/main-site/src/features/request-management/pages/RequestDetailPage.tsx`
- `frontend/apps/main-site/src/features/quotes/pages/QuoteComparisonPage.tsx`
- `frontend/apps/main-site/src/features/threads/pages/ThreadDetailPage.tsx`
- `frontend/apps/admin-site/src/features/reviews/pages/ReviewQueuePage.tsx`
- `frontend/apps/admin-site/src/features/stats/pages/StatsDashboardPage.tsx`

문제:

- 버튼, 카드, 배지, 입력창, 여백 규칙이 모두 페이지 안에 흩어져 있음
- 공통 컴포넌트 없이 페이지가 스스로 디자인을 떠맡고 있음

영향:

- 비슷한 버튼인데 화면마다 모양이 달라짐
- 디자인 수정 시 파편적으로 고쳐야 함

## 3.3 정보 위계 부족

문제:

- 제목, 보조 설명, 상태, 경고, 행동 버튼이 모두 비슷한 강도로 보임
- 사용자는 “어디가 핵심인지”를 바로 파악하기 어려움

영향:

- 제품이 복잡해 보임
- 중요한 행동으로 자연스럽게 유도되지 않음

---

## 4. main-site 진단

## 4.1 공급자 탐색 화면

대상 파일:

- `frontend/apps/main-site/src/features/discovery/pages/SupplierSearchPage.tsx`

문제:

- 필터 영역이 단순 입력칸 나열 수준이라 탐색 경험이 약함
- 공급자 카드가 정보는 많지만 시선이 머무는 포인트가 없음
- “왜 이 공급자를 봐야 하는지”를 강조하는 요소가 부족함
- 리스트 전체가 너무 균등해서 비교가 잘 안 됨

영향:

- 탐색 서비스인데도 탐색 재미와 신뢰감이 약함
- 요청자가 공급자를 고르는 판단 속도가 느려질 수 있음

필요한 개선 방향:

- 검색 헤더와 필터를 분리
- 공급자 카드에 핵심 역량 배치 재정리
- 검증 상태와 제조 포인트를 빠르게 읽히게 만들기

## 4.2 의뢰 상세 화면

대상 파일:

- `frontend/apps/main-site/src/features/request-management/pages/RequestDetailPage.tsx`

문제:

- 정보량은 많지만 읽는 흐름이 단조롭다
- 상태 배지, 주요 메타 정보, 행동 버튼의 시각 우선순위가 약하다
- 수정 폼과 읽기 화면의 분리가 충분히 명확하지 않다
- 지정 공급자와 대화 시작 영역도 기능은 있으나 설득력이 약하다

영향:

- 요청자가 “이 의뢰가 지금 어떤 상태인지” 바로 파악하기 어렵다
- 운영 흐름상 중요한 게시/마감/취소 액션이 가볍게 보인다

필요한 개선 방향:

- 헤더 영역 재설계
- 상태/요약/행동을 상단에서 강하게 분리
- 본문은 카드 단위로 나눠 가독성 확보

## 4.3 견적 비교 화면

대상 파일:

- `frontend/apps/main-site/src/features/quotes/pages/QuoteComparisonPage.tsx`

문제:

- 비교 화면의 핵심은 “차이를 빠르게 읽는 것”인데 현재 표는 정보 표시 위주에 머문다
- 필터와 정렬 버튼의 시각 체계가 약하다
- 중요 행동인 선택 / 거절 / 메시지 이동의 시선 유도력이 약하다
- 상태별 강조가 더 정교해야 한다

영향:

- 비교가 되는 느낌보다 데이터 테이블을 보는 느낌이 강함

필요한 개선 방향:

- 상단 요약 바 강화
- 표 가독성 개선
- 선택 가능 상태와 이미 종료된 상태를 더 확실히 구분

## 4.4 메시지 상세 화면

대상 파일:

- `frontend/apps/main-site/src/features/threads/pages/ThreadDetailPage.tsx`

문제:

- 기능량은 많지만 시선 흐름이 매끄럽지 않다
- 헤더, 연락처 공유 상태, 메시지 영역, 입력 영역의 구분은 있으나 밀도 차이가 부족하다
- 버튼 기본 스타일이 너무 기본형이라 중요한 합의 행동이 가볍게 보인다
- 대화 공간 자체의 감정적 톤이 약하다

영향:

- 이 화면은 실제 거래 신뢰를 쌓는 핵심 화면인데, 현재는 업무 툴처럼만 느껴진다

필요한 개선 방향:

- 대화 헤더 / 상태 배너 / 공유 카드 / 입력 박스 체계 재정리
- 말풍선 / 첨부 / 행동 영역의 밀도 차별화

## 4.5 공지 화면

대상 파일:

- `frontend/apps/main-site/src/features/notices/pages/NoticeListPage.tsx`
- `frontend/apps/main-site/src/features/notices/pages/NoticeDetailPage.tsx`

문제:

- 공지 성격상 차분하면 되지만, 현재는 너무 평평해서 정보성 페이지 이상의 느낌이 없다
- 제목, 날짜, 본문 구조의 편집감이 부족하다

영향:

- 읽히긴 하지만 서비스 공식 공지로서의 신뢰감이 약하다

---

## 5. admin-site 진단

## 5.1 검수 큐 화면

대상 파일:

- `frontend/apps/admin-site/src/features/reviews/pages/ReviewQueuePage.tsx`

문제:

- 관리자 화면답게 빠른 판단이 가능해야 하는데 현재는 단순 표 형태라 우선순위 판단이 어렵다
- 필터 영역도 관리 업무 도구처럼 정제되어 있지 않다
- “지금 급한 건 무엇인지”가 안 보인다

영향:

- 운영자가 빠르게 처리하기 어렵다

필요한 개선 방향:

- 대기 건 요약, 상태 분포, 필터 바, 테이블 강조 체계를 재구성

## 5.2 통계 대시보드

대상 파일:

- `frontend/apps/admin-site/src/features/stats/pages/StatsDashboardPage.tsx`

문제:

- 숫자는 많지만 “대시보드”로 느껴질 만큼 구조화되어 있지 않다
- 카드와 바 차트가 모두 인라인 스타일로 구성돼 있고, 시각적 리듬이 약하다
- 중요한 숫자와 보조 숫자의 차이가 덜 느껴진다

영향:

- 운영 현황이 숫자로는 보이지만 판단 도구로서의 인상이 약하다

필요한 개선 방향:

- 상단 KPI 카드 강화
- 차트/상태 분포 카드 개선
- 날짜 필터 영역 정리

## 5.3 관리자 공지 화면

대상 파일:

- `frontend/apps/admin-site/src/features/notices/pages/NoticeListPage.tsx`

문제:

- CRUD 기능은 있으나 운영 도구처럼 정돈된 느낌이 약하다
- 작성/수정/게시/보관 액션이 명확한 워크플로우처럼 보이지 않는다

영향:

- 관리자 입장에서 공지 운영의 체계성이 약하게 느껴질 수 있다

---

## 6. 가장 큰 구조적 원인

이번 디자인 문제는 특정 한 화면의 문제가 아니라, 아래 두 가지가 근본 원인이다.

### 원인 1. 공통 레이아웃과 공통 컴포넌트가 약함

- app shell
- section header
- info card
- action button
- filter bar
- data table
- empty state

같은 공통 블록이 거의 체계적으로 정의되어 있지 않다.

### 원인 2. 제품 톤이 아직 정해지지 않음

- main-site는 신뢰형 B2B 탐색 서비스 톤이 필요함
- admin-site는 운영 효율 중심의 내부 툴 톤이 필요함

지금은 둘 다 “개발 기본 화면” 느낌이 남아 있다.

---

## 7. 결론

현재 디자인은 기능 확인에는 충분하지만,

- 제품 신뢰감
- 사용성
- 우선순위 인지
- 서비스 완성도

측면에서는 보강이 꼭 필요하다.

가장 먼저 손대야 할 것은

1. 공통 스타일 체계
2. main-site 핵심 거래 흐름 화면
3. admin-site 핵심 운영 화면

순서다.
