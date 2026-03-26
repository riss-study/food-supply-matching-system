# Phase 2 실행 계획

Date: 2026-03-25
Status: Draft

## 1. 목적

Phase 2는 이미 완성된 Phase 1의 매칭 코어를 크게 흔들지 않으면서, 그 위에 신뢰도와 실행 품질을 높이는 개선을 얹는 단계다.

핵심 목표는 기존의 공급자 탐색 -> 의뢰 -> 견적 -> 대화 흐름을 더 믿을 수 있고 더 잘 작동하게 만드는 것이다. 무거운 외부 연동이나 전혀 새로운 비즈니스 도메인은 그 이후에 다룬다.

## 2. 비목표

- 첫 번째 Phase 2 웨이브에서 결제, 에스크로, 전자계약, 분쟁 조정 흐름까지 확장하지 않는다.
- 첫 번째 Phase 2 웨이브에서 OCR, 외부 검증 API, AI 추천, 챗봇 자동화를 넣지 않는다.
- 파일 저장소 벤더, CDN, 지도 공급자, 실시간 전송 방식을 launch gate가 없는 상태에서 먼저 결정하지 않는다.
- 반복적인 교차 앱 재사용 근거 없이 플랫폼 전면 재구성이나 패키지 분리를 하지 않는다.

## 3. 현재 상태 요약

- Phase 1은 구현과 검증이 모두 완료됐다.
- requester, supplier, admin, quote, thread, contact-share, notice, stats 핵심 흐름이 이미 존재한다.
- 아키텍처는 dual frontend + dual backend server + CQRS 구조를 유지한다.
- 로컬 compose는 datastore 단위로 이미 분리됐다.
- Phase 1 종료 후 남아 있는 known issue는 작고 구체적이다.
  - React Router v7 future-flag warning이 테스트 로그에 남아 있다.
  - admin stats는 현재 deterministic runtime aggregation을 사용한다.
  - 브라우저 기반 seeded acceptance coverage는 아직 얇다.

## 4.1 어려운 표현 먼저 쉽게 보기

이 문서에 나오는 어려운 표현은 아래처럼 이해하면 된다.

- `launch readiness`: 실제 서비스 오픈을 준비할 수 있는 상태
- `execution baseline`: 팀이 안정적으로 개발/검증할 수 있게 만드는 기본 작업 세트
- `MVP completion debt`: 원래 MVP에 들어가야 했지만 아직 덜 닫힌 항목
- `matching-core extension`: 현재 매칭 흐름을 더 좋게 만드는 기능 확장
- `scalability hardening`: 사용자가 늘어났을 때도 버티도록 구조를 다지는 작업
- `vertical slice`: 한 기능을 기획-백엔드-프론트-테스트까지 세로로 한 번에 끝내는 방식
- `runtime config`: 실행 환경에 따라 바뀌는 설정값
- `code-first OpenAPI`: 별도 문서 파일보다 코드 안의 annotation으로 API 문서를 관리하는 방식
- `evidence`: 실제로 검증했다는 기록 파일
- `smoke test`: 전체를 깊게 보는 테스트는 아니지만, 핵심 기능이 살아 있는지 빠르게 확인하는 테스트
- `hot query`: 데이터가 많아질 때 느려질 가능성이 높은 조회 로직
- `gate`: 다음 단계로 넘어가기 전에 통과해야 하는 기준

## 4. 숨은 가정

- admin user/supplier list 기능은 진짜 Phase 2 scope가 아니라 Phase 1 completion debt일 수 있다.
- 현재 local-first runtime 설정은 launch readiness의 증거가 아니다. 즉, 로컬에서 돌아간다고 바로 서비스 오픈 준비가 끝난 것은 아니다.
- deterministic admin stats는 트래픽이 작을 때만 허용 가능한 선택이다. 즉, 지금은 단순 계산으로 충분하지만 사용자가 늘면 구조를 바꿔야 할 수 있다.
- 다음 마일스톤이 pilot launch인지, 아니면 기능 확장 웨이브인지에 따라 우선순위가 달라진다.

## 5. Phase 2 원칙

- 새로운 루프를 만들기 전에 현재 루프를 더 깊게 만든다.
- 넓은 인프라 프로그램보다 vertical slice를 우선한다.
- 선택한 Phase 2 epic이 실제로 건드리는 hotspot만 수정한다.
- backend 경계는 기존 모듈 구조에 맞춘다.
- 공유 히스토리에는 green commit만 남긴다.
- code-first OpenAPI와 evidence 규칙을 유지한다.

## 6. 권장 우선순위

### P0. Launch Readiness + 실행 베이스라인

이 작업들은 비용이 낮고 위험을 줄이며, 기능 확장 전에 “안정적으로 개발하고 배포 준비를 할 수 있는 기본 상태”를 만든다.

- 핵심 end-to-end 흐름에 대한 browser-driven acceptance baseline
  - 쉽게 말해: 실제 사용자가 버튼을 누르고 이동하는 흐름을 브라우저 수준에서 자동 확인하는 기본 테스트
- 기존 backend/frontend green path를 지속적으로 실행하는 CI/check 자동화
  - 쉽게 말해: 사람이 매번 수동으로 확인하지 않아도, 코드가 깨졌는지 자동으로 알려주는 장치
- 테스트와 라우트 설정의 React Router warning 정리
- 얇은 frontend README를 repo 맞춤형 run/test/deploy 문서로 보강
- runtime config 외부화와 local이 아닌 배포 posture 정리
  - 쉽게 말해: 개발자 PC 기준 값이 아니라 운영 환경에서도 안전하게 바꿔 끼울 수 있는 설정 구조 만들기

### P1. MVP Completion Debt

이 항목들은 “새로운 기능”이라기보다, 원래 MVP에서 닫혔어야 하는데 덜 마무리된 부분에 가깝다.

- Decision item: admin requester/supplier list가 미완료 MVP 범위인지, 진짜 Phase 2 scope인지 먼저 확정
  - 쉽게 말해: 원래 있어야 했는데 빠진 화면인지, 아니면 진짜 다음 단계 기능인지 먼저 판단
- admin review history와 audit 노출 보강
- supplier discovery sort/filter/index 마무리
- admin/public endpoint의 Swagger/example polish

### P2. Matching-Core Extension

현재 핵심 흐름의 신뢰도나 실제 성과를 높이는 작은 기능 묶음을 하나만 선택한다.

권장 1순위 후보:

- 완료된 request/quote 관계를 기준으로 하는 reviews and ratings

그 다음 후보:

- supplier profile completeness 개선
- onboarding / notification UX polish

### P3. Scalability Hardening

첫 기능 확장 이후 실제로 느린 부분이나 운영 불편이 드러난 다음 수행한다.

- 가장 뜨거운 in-memory filtering read를 repository-backed pagination/sorting으로 교체
  - 쉽게 말해: 메모리에서 한꺼번에 꺼내서 정렬/필터하던 조회를, DB가 더 잘 처리하도록 바꾸기
- admin stats aggregation 비용이 보이기 시작하면 projection/caching 재검토
  - 쉽게 말해: 통계를 매번 즉석 계산하지 말고, 미리 모아두는 구조가 필요한지 검토하기
- seed/evidence coverage를 반복 가능한 smoke suite로 확장
  - 쉽게 말해: 테스트용 데이터와 검증 기록을 더 체계적으로 돌릴 수 있게 만들기
- launch나 scale이 실제로 요구될 때만 file-storage path hardening 진행
  - 쉽게 말해: 파일 저장 구조는 실제 오픈이 가까워질 때 운영 기준으로 강화하기

### P4. Deferred Expansion Tracks

이 항목들은 Phase 2+ 후보이며, 첫 번째 Phase 2 범위가 아니다.

- map-based discovery
- real-time communication upgrades
- OCR automation
- external verification APIs
- AI recommendation/tagging/FAQ
- payment, escrow, e-contract
- community and content features

## 7. 이 순서가 맞는 이유

- 기존 request, quote, thread, supplier, admin-review 모듈 재사용이 가장 크다.
- PRD에서 아직 open으로 남겨둔 vendor/transport 결정들을 뒤로 미룰 수 있다.
- usage signal 없이 admin stats나 platform infra를 먼저 과최적화하지 않게 해준다.
- 이미 작동하는 matching loop 안에서 trust와 conversion을 먼저 개선한다.

## 8. 아키텍처 가드레일

- write concern은 `command-domain-*` + relational persistence에 둔다.
  - 쉽게 말해: 저장/상태변경 규칙은 지금처럼 백엔드 쓰기 모듈에 모은다.
- read concern은 read complexity가 충분히 클 때만 `query-model-*`에 둔다.
  - 쉽게 말해: 조회가 단순하면 굳이 별도 조회 모델을 늘리지 않는다.
- `projection`은 cross-model update path에만 사용하고, write-side rule을 projection 안에 숨기지 않는다.
  - 쉽게 말해: 화면용 조회 데이터를 맞춰주는 역할만 하고, 핵심 비즈니스 규칙은 거기에 넣지 않는다.
- admin metric은 실제 비용이 나타나기 전까지 runtime aggregation을 우선한다.
- 둘 이상의 앱이 같은 concern을 필요로 하지 않으면 shared frontend package를 늘리지 않는다.
- synchronous write path 위에 realtime/external-provider 동작을 바로 얹지 않는다.
  - 쉽게 말해: 지금도 중요한 저장 흐름은 단순해야 하므로, 무거운 외부 연동을 바로 얹지 않는다.

## 9. 첫 번째 Phase 2에서 넣지 말아야 할 것

- launch-readiness 작업과 같은 마일스톤 안에 AI, OCR, external verification, payment, escrow, e-contract, community 기능을 같이 넣지 않는다.
- 여러 개의 새로운 product track을 동시에 시작하지 않는다.
- 반복 재사용 근거 없는 넓은 플랫폼 재구성을 하지 않는다.

## 10. Phase 2 Wave Plan

### Wave 0 - 계획 고정

- Phase 2 subplan index 생성
- 선택된 P0/P1/P2 항목을 atomic subplan으로 분해
- 각 task의 verification command와 evidence target 정의

### Wave 1 - Launch Readiness + Delivery Baseline

- CI/check harness
- browser acceptance skeleton
- router warning cleanup
- frontend doc cleanup

### Wave 2 - MVP Completion Debt Closure

- admin review history/audit 보강
- supplier discovery backend sorting/indexing
- supplier discovery UI sort/filter 보강
- admin/public endpoint Swagger/example polish

### Wave 3 - Controlled Product Extension

- reviews and ratings vertical slice
- supplier discovery와 quote follow-up 주변 trust/relevance UX refinement

### Wave 4 - Scalability and Operability Gate

- hot query hardening
- stats aggregation 재검토
- launch scope나 usage가 정당화할 때만 storage/runtime decision gate 수행

## 11. 초기 Task 후보

추천하는 초기 Phase 2 task 목록:

1. `phase2-task-01-e2e-and-ci-baseline`
2. `phase2-task-02-router-and-doc-hygiene`
3. `phase2-task-03-admin-review-history-and-audit`
4. `phase2-task-04-supplier-discovery-sort-and-index`
5. `phase2-task-05-swagger-and-contract-polish`
6. `phase2-task-06-reviews-and-ratings-foundation`
7. `phase2-task-07-hot-query-hardening`

## 12. TDD 및 검증 매트릭스

각 Phase 2 task는 최소한 다음을 선언해야 한다.

- write logic 변경 시 command/domain test
- read model 변경 시 query/projection test
- API contract 변경 시 server/application/controller test
- UI behavior 변경 시 frontend hook/page test
- 흐름이 중요한 경우 browser-level smoke coverage
- exact evidence command와 capture output

쉽게 말해, 기능 하나를 추가할 때도

- 저장 규칙이 맞는지
- 조회 결과가 맞는지
- API 응답이 맞는지
- 화면 동작이 맞는지
- 실제 사용자 흐름이 크게 안 깨졌는지

를 각각 확인하겠다는 뜻이다.

## 13. Evidence 규칙

- 각 task는 `.sisyphus/evidence/phase2-task-xx-<slug>.txt`를 사용한다.
- exact command, pass/fail result, scoped warning을 기록한다.
- architectural tradeoff가 있으면 짧은 decision note를 함께 남긴다.

## 14. Atomic Commit 전략

- `docs(phase2): roadmap, assumptions, wave priority 고정`
- `test(e2e): failing browser acceptance harness 추가`
- `ci: backend/frontend build-test workflow 추가`
- `chore(config): runtime config와 secret handling 외부화`
- `test(scope): characterization coverage 추가`
- `feat(scope): backend vertical slice 구현`
- `feat(scope): frontend vertical slice 연결`
- `docs(scope): evidence와 plan status 동기화`

큰 slice는 backend/frontend commit을 분리하고, 작은 slice는 하나의 green vertical commit으로 유지한다.

쉽게 말해:

- 큰 기능은 서버 작업과 화면 작업을 나눠서 기록하고
- 작은 기능은 한 번에 끝나는 단위로 묶되
- 항상 “통과한 상태”만 커밋한다.

## 15. 첫 번째 Phase 2 마일스톤 종료 기준

- P0 baseline이 완료됐다.
- P1 residual gap이 닫혔다.
- 좁은 P2 product-extension slice 1개가 실제로 전달됐다.
- backend와 두 frontend 앱이 full build/test에서 green을 유지한다.
- 모든 Phase 2 task에 대해 새로운 evidence artifact가 존재한다.

## 16. Escalation Trigger

다음 마일스톤이 feature wave가 아니라 pilot 또는 production launch라면, 새로운 product scope보다 아래 항목을 먼저 수행한다.

- admin-role enforcement audit
- local file-storage replacement decision
- hot query pagination/sort hardening
- launch-critical flow의 browser acceptance coverage
