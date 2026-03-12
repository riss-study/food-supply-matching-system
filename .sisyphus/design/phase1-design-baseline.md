# Phase 1 MVP 설계 기준선

> 버전: 1.0
> 상태: Active
> 범위: 신뢰형 매칭 코어만 포함
> 상위 기준: `../plans/document-structure-plan.md`, `../drafts/1st-phase-requirements-final.md`, `../drafts/PRD-v1.0-MVP-Korean.md`

---

## 1. 문서 목적

이 문서는 Phase 1 구현 기준선을 고정해, 하위 설계 문서가 다시 제품 범위를 흔들지 못하게 하는 역할을 한다.

---

## 2. 포함 범위

- 요청자 사업자 온보딩
- 공급자 가입 및 프로필 작성
- 공급자 검수 제출 및 관리자 심사
- 검색/필터 기반 공급자 탐색
- 의뢰 생성
- 공개 의뢰와 선택 공급자 문의
- 견적 제출 및 비교
- 메시지 스레드, 첨부, 읽음 상태
- 상호 연락처 공유 동의
- 관리자 공지 및 기본 운영 통계

---

## 3. 제외 범위

- 리뷰/평점 시스템
- 지도 기반 탐색
- WebSocket 기반 실시간 보장
- OCR 자동화
- 외부 사업자 검증 API
- AI 추천, 챗봇, 가격 예측
- 결제, 에스크로, 전자계약
- 커뮤니티, 교육, 컨설팅 운영 기능

---

## 4. 주요 사용자

| 사용자 | 정의 |
|------|------|
| 요청자 | 제조를 의뢰하는 사업자 사용자 |
| 공급자 | 프로필을 만들고 견적을 제출하는 제조사 |
| 관리자 | 검수와 기본 운영을 담당하는 내부 운영자 |

---

## 5. 핵심 객체

- UserAccount
- BusinessProfile
- SupplierProfile
- VerificationSubmission
- CertificationRecord
- Request
- Quote
- MessageThread
- Message
- Attachment
- ContactShareConsent
- Notice
- AuditLog

---

## 6. 제품 불변 규칙

1. Phase 1은 B2B 우선이다.
2. 공급자 신뢰는 검수 상태에 따라 결정된다.
3. 메시징은 의뢰/견적 맥락에 속한다.
4. 연락처는 상호 동의가 완료되기 전까지 숨긴다.
5. 수동 검수가 MVP의 신뢰 메커니즘이다.
6. Phase 1은 필수적인 제3자 연동 없이도 구현 가능해야 한다.

---

## 7. 기준 용어

| 용어 | 의미 |
|------|------|
| Requester | 수요 측 사업자 사용자 |
| Supplier | 공급 측 제조사 |
| Verification | 공급자/사업자 신뢰 검토용 제출 정보 |
| Request | 요청자가 등록한 제조 의뢰 |
| Quote | 공급자가 제출한 견적 응답 |
| Message Thread | 요청자와 공급자 사이의 맥락 기반 대화 |
| Contact Share | 외부 연락처 공개를 위한 상호 동의 |

---

## 8. 허용 가능한 TBD

- 인프라 공급자
- 파일 저장소 공급자
- CDN
- 정확한 배포 토폴로지
- MongoDB read-model의 최종 물리 구조

이 항목들은 API, 권한, 상태 규칙에 직접 영향을 주지 않는 한 열어둘 수 있다.

---

## 9. TBD로 남기면 안 되는 것

- 검수 상태와 그 효과
- 누가 어떤 공급자/프로필 상태를 볼 수 있는지
- 의뢰와 견적 라이프사이클 규칙
- 연락처 공유 규칙
- 필수 필드와 검증 의미
- MVP API 경계

---

## 10. 하위 문서

- `phase1-information-architecture-and-flows.md`
- `phase1-permissions-and-state-model.md`
- `phase1-domain-and-data-model.md`
- `phase1-api-and-validation-spec.md`
- `phase1-acceptance-scenarios-and-backlog.md`
