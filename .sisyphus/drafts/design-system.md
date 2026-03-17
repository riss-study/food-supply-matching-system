# Design System

> 상태: Active Guide
> 기준 문서: `system-architecture.md`, `frontend-guide.md`

---

## 1. 목적

이 문서는 Phase 1 프론트엔드의 시각적/상호작용 기준을 정리한다.

- 메인 사이트와 관리자 사이트가 다른 목적을 가져도 하나의 브랜드 언어를 공유하게 한다.
- `Emotion + Radix UI + Tailwind` 조합에서 토큰과 시각 규칙의 기준점을 제공한다.

---

## 2. 디자인 철학

- 정보 흐름이 막히지 않는 UI
- Warm Neutral 기반의 차분한 신뢰감
- B2B 매칭 서비스에 맞는 명확한 상태 표현
- 관리자 운영 화면에서도 과한 장식보다 가독성과 판독성을 우선

비목표:

- 과한 SaaS 템플릿 감성
- 의미 없는 장식적 애니메이션
- 읽기 힘든 고대비 / 과포화 UI

---

## 3. 사이트별 디자인 역할

### main-site

- 브랜드 / 탐색 / 비교 / 상담 진입 중심
- 신뢰 형성과 정보 이해가 우선
- 공급자 탐색, 의뢰, 견적 비교, 메시지 맥락이 자연스럽게 이어져야 함

### admin-site

- 운영 효율 / 상태 판독 / 빠른 액션 중심
- 검수 큐, 검수 상세, 공지 관리, 통계가 우선
- 장식보다 정보 밀도와 상태 가시성을 우선

---

## 4. 토큰 시스템

### 4.1 Color

- Warm Neutral surface
- 차분한 본문 텍스트
- Accent는 강조보다 상태/그룹 구분 용도

필수 상태 토큰:

- success / approved
- warning / hold
- danger / reject
- muted / inactive
- info / pending

### 4.2 Typography

- 기본 폰트 baseline: `Noto Sans JP`
- 본문 가독성 우선
- 숫자/지표는 tabular number 사용 권장

### 4.3 Spacing / Radius / Shadow

- 일관된 spacing scale 유지
- 카드 / 입력 / 버튼 radius는 단계형으로 제한
- shadow는 soft depth로 제한

---

## 5. 컴포넌트 계층

### Radix UI

- 접근성 기반 primitive
- Dialog, Select, Tabs, Popover 같은 foundation 제공

### Tailwind

- layout / spacing / responsive utility
- 빠른 page composition

### Emotion

- token-driven theme binding
- variant가 많은 공통 컴포넌트의 dynamic style
- Tailwind class만으로 관리하기 어려운 상태 조합 처리

규칙:

- 토큰은 공통 theme source를 기준으로 유지한다.
- utility와 dynamic style의 역할을 분리한다.
- 공통 컴포넌트는 `packages/ui`에서 관리한다.

---

## 6. 상태 표현 기준

### 공급자 검수 상태

- draft
- submitted
- under_review
- hold
- approved
- rejected
- suspended

### 연락처 공유 상태

- not_requested
- requested
- one_side_approved
- mutually_approved
- revoked

규칙:

- 상태는 텍스트만이 아니라 badge / color / icon / helper text로 함께 표현한다.
- `hold`와 `reject`는 사용자에게 혼동되지 않게 분리 표현한다.
- admin 내부 메모와 사용자 노출 문구는 시각적으로도 분리한다.

### 6.1 노출 / 숨김 규칙

- 공개 사용자는 탐색 중심 UI만 본다.
- 공급자 신뢰 상태는 search / detail 모두에 일관되게 노출한다.
- 연락처는 `mutually_approved` 전까지 시각적으로도 숨김 상태를 유지한다.
- 관리자 전용 메모와 운영 액션은 메인 사용자 surface에 절대 노출하지 않는다.

---

## 7. 페이지 패턴

### main-site 주요 패턴

- supplier search list
- supplier detail
- request form
- quote comparison
- thread summary / thread detail
- public notice list

### admin-site 주요 패턴

- review queue
- review detail
- notice management
- stats summary

### 7.1 흐름 기반 패턴

- 공급자 검수 흐름: 제출 -> 검토 -> 승인/보류/반려
- 의뢰 등록 흐름: 승인 게이트 -> 폼 입력 -> 모드 선택 -> 게시
- 견적 비교 흐름: 수신 -> 비교 -> 선택/거절
- 연락처 공유 흐름: 요청 -> 일방 승인 -> 상호 승인 -> 공개

---

## 8. 애니메이션 기준

- `Lottie-web`은 사용 가능하나 남용하지 않는다.
- 탐색/상담/검수 핵심 흐름을 방해하지 않아야 한다.
- decorative animation보다 상태 전환의 명확성을 우선한다.

---

## 9. 접근성 / 국제화 기준

- Radix UI 기반 접근성 기준 유지
- 상태와 액션은 색에만 의존하지 않는다.
- `i18next`를 전제로 라벨 길이 변화에 견디는 컴포넌트를 설계한다.
- 한글/일본어 혼합 문맥에서도 line-height와 spacing을 유지한다.

---

## 10. 구현 시 금지사항

- 메인 사이트와 관리자 사이트를 완전히 다른 브랜드처럼 만드는 것
- 상태 표현을 색 하나에만 의존하는 것
- Emotion / Tailwind 역할 없이 스타일을 뒤섞는 것
- 관리자 전용 정보를 사용자 UI 패턴과 같은 톤으로 숨기는 것

---

## 11. 읽는 순서

1. `system-architecture.md`
2. `frontend-guide.md`
3. 이 문서
