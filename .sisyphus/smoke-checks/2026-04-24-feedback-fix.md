# 2026-04-24 피드백 수정 — 브라우저 수동 smoke 체크리스트

> **커밋 용도 아님 / 개인 노트**. 사용자가 나중에 브라우저에서 직접 확인할 목록.

**전제**: Vite HMR 반영 상태. api-server(8080), admin-server(8081), main-site(5173) 기동 중.

---

## ✅ Fix 1 — 메시지 "며칠 전" 자정 경계

**경로**: `/threads`
**대상 파일**: `src/features/threads/pages/ThreadListPage.tsx` L10-22

**확인**:
- [ ] 어제 23:55 이전 수신 메시지를 오늘 00:10 에 볼 때 → "1일 전" (기존엔 "00:10" 시간 표시)
- [ ] 오늘 낮에 수신한 메시지 → 시간만 표시 (`HH:MM`)
- [ ] 7일 이상 지난 메시지 → `MM월 DD일` 표시
- [ ] `thd_seed_01~04` 등 seed 스레드 시간 표시 합리적

---

## ✅ Fix 2 — 공급자 탐색 필터 정리

**경로**: `/suppliers`
**대상 파일**: `src/features/discovery/pages/SupplierSearchPage.tsx`, `src/i18n/locales/ko/discovery.json`

**확인 (필터 사이드바)**:
- [ ] 키워드 검색 / 카테고리 드롭다운 / MOQ 입력 / OEM/ODM 칩 / "필터 적용" 버튼만 보임
- [ ] **지역 드롭다운 사라짐**
- [ ] **월 생산능력 입력 필드 사라짐**

**확인 (정렬 옵션)**:
- [ ] "최신 등록순 / 업체명 / MOQ" 3개만 보임
- [ ] **월 생산능력 정렬 옵션 사라짐**

**확인 (카드 표시)**:
- [ ] 카드 안의 지역·카테고리·OEM/ODM·월생산·MOQ 표시는 **유지** (정보 자체는 남김, 필터만 제거)
- [ ] 정렬 동작: 업체명 ASC/DESC, MOQ ASC/DESC 정상

---

## ✅ Integration — 의뢰 작성/수정 폼 통합

**경로 (작성)**: `/requests/new`
**경로 (수정)**: `/requests/:requestId` → "수정" 버튼 클릭
**대상 파일**: `src/features/request-management/components/RequestForm.tsx` (신규), `RequestCreatePage.tsx`, `RequestEditForm.tsx`

### 작성 (`/requests/new`)
- [ ] 기본정보: 제목(text 5~200자) / 카테고리(드롭다운 8개) / 의뢰방식(공개|지정) / 희망수량(**text, 숫자+단위 자유**)
- [ ] 제조 조건:
  - [ ] **최소 단가 / 최대 단가 각각 별도 텍스트 입력** (`~` split 없어짐)
  - [ ] `300원/kg`, `500원/kg` 등 텍스트 자유 입력, **맨끝 스페이스바 정상 작동**
  - [ ] 인증 요구사항 드롭다운 (HACCP / ISO 22000 / FSSC 22000 / 유기농 / 할랄 / 코셔)
  - [ ] 원료 규정 드롭다운 (의뢰자/공급자 제공)
  - [ ] 포장 요구사항 드롭다운 (프라이빗 라벨/벌크/없음)
  - [ ] 납품 요구사항 text
  - [ ] 추가 요청사항 textarea (최대 2000자)
- [ ] "지정" 모드 시 공급자 선택 영역 노출 (1개 이상 필수)
- [ ] 공급자 상세에서 "의뢰하기" 클릭 시 targetSupplier prefill 되어 작성 페이지 진입, 해제 가능
- [ ] 유효성 미달 시 버튼 disabled + 안내 메시지 (제목 5자 / 카테고리 / 희망수량 / 지정공급자)

### 수정 (`/requests/:id` "수정" 버튼)
- [ ] **통합 폼이 뜸** (작성과 같은 레이아웃)
- [ ] 카테고리 / 의뢰방식 입력 필드는 **회색 disabled**, 값만 표시 (수정 불가)
- [ ] 제목·희망수량·최소단가·최대단가·인증 요구사항·원료 규정·포장 요구사항·납품·추가사항 전부 **수정 가능**
- [ ] `certificationRequirement` 가 기존 수정 폼에 없었는데 **이번부턴 표시됨**
- [ ] 기존 값 로드 확인: 예전 300/500 값 있었으면 `targetPriceMin=300`, `targetPriceMax=500` 각 필드에 들어감
- [ ] "변경 저장" → API PATCH → 목록 반영

### 상세 표시 (`RequestInfoSection`)
- [ ] 값 없는 필드 (예: targetPriceRange 비어있음) 는 상세 섹션에서 **숨김 유지** — 수정 누르면 폼에 공란으로 노출, 값 입력 후 저장하면 이번엔 상세에도 표시

---

## ✅ 자동 검증 (참고용 — 이미 OK)

- `yarn type-check` → exit 0
- `yarn test` (vitest) → 22 files / 105 tests 전부 pass

---

## ⚠️ 알려진 미해결 / 다음 단계

다음 세션에서 착수할 항목 (이번 수정 스코프 밖):

1. **SSOT 상수화** — `RAW_MATERIAL_RULES` / `PACKAGING_REQUIREMENTS` / `CERTIFICATION_CODES` 를 `packages/config` 로 추출 → 현재 RequestForm / 필터 중 하드코드된 부분 일괄 치환
2. **필터 카테고리 통일** — `/api/suppliers/categories` 동적 DB 기반 → `SUPPLIER_CATEGORY_CODES` 상수 기반 전환, 카운트는 라벨 뒤 `(N)` 으로만 붙임
3. **인증 요구사항 "기타(직접입력)"** 옵션 추가
4. **인증 요구사항 다중 선택** 허용 (백엔드는 이미 `String[]`)
5. **WebSocket 메시지 실시간화** — 별도 Phase/Task
6. **결제 조건** 필드 추가 — 별도 Phase

---

**이 파일은 수동 테스트 체크용 메모. git 커밋하지 말 것.**
