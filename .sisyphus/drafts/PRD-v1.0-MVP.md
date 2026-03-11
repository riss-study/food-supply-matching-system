# Product Requirements Document (PRD) - v1.0 MVP

> Project / 프로젝트: food2008-matching
> Version / 버전: 1.0.0-MVP
> Status / 상태: Active
> Role / 역할: Bilingual reference mirror
> Canonical Detail / 기준 상세 문서: `PRD-v1.0-MVP-Korean.md`

---

## 1. Positioning / 문서 위치

This document is a bilingual reference mirror of the Korean PRD.

이 문서는 한글 PRD를 기준으로 한 혼합형 참고 문서다.

Long-term vision remains broader than the MVP, but the build scope for v1.0 is intentionally narrow.

장기 비전은 MVP보다 넓지만, v1.0 구현 범위는 의도적으로 좁게 유지한다.

---

## 2. Product Direction / 제품 방향

### Vision / 비전

- Long-term: matching + trust + operations support + community/content + later AI
- 장기 방향: 매칭 + 신뢰 관리 + 운영 지원 + 커뮤니티/콘텐츠 + 이후 AI 확장

### v1.0 MVP / 1차 MVP

- Trusted matching core only
- 신뢰형 매칭 코어에만 집중

Included / 포함:

- registration and verification state / 가입 및 검증 상태 관리
- supplier profiles / 공급자 프로필
- search and filtering / 검색 및 필터
- requests and quotations / 의뢰 및 견적
- message threads / 메시지 스레드
- basic admin review / 관리자 기본 검수

Deferred / 보류:

- reviews / 리뷰
- maps / 지도
- real-time upgrades / 실시간성 강화
- OCR and external verification APIs / OCR 및 외부 검증 API
- AI features / AI 기능
- payment and contracts / 결제 및 계약
- community expansion / 커뮤니티 확장

---

## 3. Core Roles / 핵심 역할

| Role | Summary |
|------|---------|
| Requester / 요청자 | business-side user posting manufacturing requests |
| Supplier / 공급자 | manufacturer creating profile and sending quotations |
| Admin / 관리자 | operator reviewing verification and managing notices |

---

## 4. Core Features / 핵심 기능

### AUTH-001 Registration & Verification / 가입 및 검증

- Email registration and login / 이메일 가입 및 로그인
- Role selection / 역할 선택
- Manual review first / 수동 검수 우선
- Verification state display / 검증 상태 표시

### PROFILE-001 Supplier Profile / 공급자 프로필

- core company info / 기본 회사 정보
- manufacturing capability / 제조 역량
- certification fields / 인증 정보
- exposure linked to verification state / 검증 상태 기반 노출

### SEARCH-001 Discovery / 탐색

- keyword search / 키워드 검색
- card + list view / 카드 + 리스트 뷰
- category, region, verification, production capability, MOQ, OEM/ODM filters / 카테고리, 지역, 인증, 생산 역량, MOQ, OEM/ODM 필터

### REQUEST-001 + QUOTE-001 / 의뢰 및 견적

- request posting / 의뢰 등록
- supplier quotation / 공급자 견적 제출
- quotation comparison / 견적 비교

### MESSAGE-001 Message Threads / 메시지 스레드

- text + file attachments / 텍스트 + 파일 첨부
- read state / 읽음 상태
- contact release after mutual agreement / 상호 동의 후 연락처 공개

### ADMIN-001 Admin Basics / 관리자 기본 기능

- review submissions / 제출 정보 심사
- change supplier state / 공급자 상태 변경
- post notices / 공지 등록
- view basic metrics / 기초 통계 확인

---

## 5. Technical Baseline / 기술 기준선

| Area / 영역 | Baseline / 기준 |
|-------------|------------------|
| Frontend / 프론트엔드 | React |
| Backend / 백엔드 | Kotlin Spring Boot |
| RDB / 관계형 저장소 | MariaDB or MySQL-compatible |
| Query Store / 조회 저장소 | MongoDB |
| Design Direction / 설계 방향 | CQRS |

Still open / 미확정:

- infrastructure / 인프라
- file storage / 파일 저장소
- CDN
- map provider / 지도 제공자
- verification API / 검증 API
- real-time transport / 실시간 전송 방식

---

## 6. References / 참고 문서

- `1st-phase-requirements-final.md`
- `requirements-final-summary-v1.1.md`
- `PRD-v1.0-MVP-Korean.md`
- `PRD-v1.0-MVP-English.md`
- `.sisyphus/plans/document-structure-plan.md`
- `.sisyphus/design/phase1-design-baseline.md`
- `.sisyphus/design/phase1-information-architecture-and-flows.md`
- `.sisyphus/design/phase1-permissions-and-state-model.md`
- `.sisyphus/design/phase1-domain-and-data-model.md`
- `.sisyphus/design/phase1-api-and-validation-spec.md`
- `.sisyphus/design/phase1-acceptance-scenarios-and-backlog.md`

---

## 7. Sync Rule / 동기화 규칙

If this file conflicts with the Korean PRD, the Korean PRD wins.

이 문서가 한글 PRD와 충돌하면 한글 PRD를 우선한다.
