# UI 리디자인 결정안

Date: 2026-03-26
Status: Completed (2026-04-02 전면 적용 완료)

기준 문서:

- `/.sisyphus/drafts/ui-design-diagnosis-v1.md`
- `/.sisyphus/plans/ui-redesign-priority-plan.md`
- `/.sisyphus/drafts/ui-multi-perspective-review-v1.md`

## 1. 이번 리디자인에서 반드시 반영할 결정

### 결정 1. 헤더는 길 찾기만 담당한다

- 헤더에 모든 화면 링크를 다 넣지 않는다.
- 전역 이동만 남긴다.

### 결정 2. 메뉴는 역할별로 달라진다

- 비로그인: 둘러보기 / 공지 / 로그인 / 회원가입
- 요청자: 공급자 탐색 / 내 의뢰 / 메시지 / 사업자 정보
- 공급자: 의뢰 피드 / 내 견적 / 메시지 / 공급자 프로필
- 관리자: 검수 / 공지 / 통계 / 로그인

### 결정 3. 로그인/회원가입은 데모 폼처럼 보이면 안 된다

- 기본값이 미리 채워져 있지 않아야 한다.
- 서비스 설명과 역할 차이가 함께 보여야 한다.
- 단순 폼이 아니라 진입 안내 화면이어야 한다.

### 결정 4. 페이지는 항상 이 구조를 따른다

1. 페이지 제목
2. 한 줄 설명
3. 핵심 행동 영역
4. 본문 정보 영역
5. 보조 액션 또는 참고 영역

### 결정 5. 공통 시각 규칙을 재사용한다

- shell
- hero card
- surface/card
- filter bar
- pagination
- action button
- empty state

## 2. 이번 리디자인 적용 대상

### 바로 수정

- `frontend/apps/main-site/src/App.tsx`
- `frontend/apps/main-site/src/features/auth/pages/LoginPage.tsx`
- `frontend/apps/main-site/src/features/auth/pages/SignupPage.tsx`
- `frontend/apps/admin-site/src/App.tsx`

### 이어서 정렬 대상

- `frontend/apps/main-site/src/features/request-management/pages/RequestListPage.tsx`
- `frontend/apps/main-site/src/features/notices/pages/NoticeListPage.tsx`
- `frontend/apps/admin-site/src/features/notices/pages/NoticeListPage.tsx`

## 3. 성공 기준

- 헤더가 더 짧고 역할 중심으로 보인다.
- 로그인/회원가입이 제품 첫인상 화면처럼 보인다.
- 사용자가 "내가 지금 뭘 할 수 있는지"를 메뉴만 보고도 이해할 수 있다.
- 기존 테스트와 빌드가 깨지지 않는다.

## 4. 현재 반영 완료 범위

- main-site 헤더를 역할 기반 메뉴 구조로 축소 및 재정리
- main-site 로그인/회원가입의 기본값 제거 및 제품 첫인상 화면 형태로 재구성
- main-site 요청자 핵심 흐름 화면 일부를 공통 shell/hero/surface 구조로 정리
- admin-site 로그인/검수/공지/통계 화면을 내부 운영 도구 톤으로 정리
- frontend 전체 테스트/타입체크/빌드 재검증 완료
