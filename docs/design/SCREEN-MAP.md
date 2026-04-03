# 화면 구성표 (Screen Map)

> `untitled.pen` 디자인 파일 기준 전체 화면 목록과 사이트별 분류

---

## 메인 사이트 (Main-site) — 18개 화면

바이어/공급자가 사용하는 프론트 사이트. `MainHeader` 컴포넌트를 사용합니다.

| # | 화면명 | 노드 ID | 설명 |
|---|--------|---------|------|
| — | Main-site Shell | `pXCHp` | 메인 사이트 공통 레이아웃 (헤더 + 콘텐츠 영역) |
| 01 | Login | `A9gc2` | 메인 사이트 로그인 |
| 02 | Signup | `JgbJr` | 회원가입 (역할 선택 포함) |
| 03 | Home | `6ZQcF` | 홈 / 대시보드 |
| 04 | Supplier Search | `Ddslo` | 공급자 검색 |
| 05 | Supplier Detail | `cmU7o` | 공급자 상세 정보 |
| 06 | Request Create | `MJXIj` | 의뢰 작성 |
| 07 | Request List | `3ZCYZ` | 의뢰 목록 |
| 08 | Request Detail | `YCVcZ` | 의뢰 상세 |
| 09 | Quote Comparison | `fQzuO` | 견적 비교 |
| 10 | Message List | `xJghY` | 메시지 목록 (인박스) |
| 11 | Thread Detail | `Tn0O5` | 메시지 스레드 상세 |
| 17 | Business Profile | `5BYnf` | 바이어 사업자 프로필 |
| 18 | Supplier Profile Mgmt | `EJ69A` | 공급자 프로필 관리 |
| 19 | Supplier Request Feed | `tBKRs` | 공급자용 의뢰 피드 |
| 20 | Supplier Request Detail | `XPwsJ` | 공급자용 의뢰 상세 |
| 21 | My Quotes | `MjjUp` | 내 견적 목록 |
| 22 | Notice List Detail | `PMeMk` | 공지사항 열람 |

---

## 관리자 사이트 (Admin-site) — 6개 화면

운영/관리자용 백오피스 사이트. `AdminSidebar` 컴포넌트를 사용합니다.

| # | 화면명 | 노드 ID | 설명 |
|---|--------|---------|------|
| — | Admin-site Shell | `3iuL2` | 관리자 사이트 공통 레이아웃 (사이드바 + 콘텐츠 영역) |
| 12 | Admin Login | `YjnBr` | 관리자 로그인 |
| 13 | 업체 검수 (Review Queue) | `Ts58n` | 공급자 검수 목록 |
| 14 | Review Detail | `GYy0g` | 검수 상세 |
| 15 | Notice Management | `MXjAo` | 공지사항 관리 (CRUD) |
| 16 | Stats Dashboard | `ApccV` | 통계 대시보드 |

---

## 공통

| 화면명 | 노드 ID | 설명 |
|--------|---------|------|
| Design System Components | `Bn9Zv` | 재사용 가능 컴포넌트 모음 (버튼, 배지, 입력 필드 등) |

---

## 재사용 컴포넌트 (Design System) — 22개

| 컴포넌트명 | 노드 ID | 카테고리 |
|-----------|---------|---------|
| BtnPrimary | `8mNkS` | 버튼 |
| BtnSecondary | `VBtVb` | 버튼 |
| BtnGhost | `EVkrn` | 버튼 |
| BtnDanger | `PTJRt` | 버튼 |
| BadgeGray | `ltSgP` | 배지 |
| BadgeBlue | `eRA5k` | 배지 |
| BadgeGreen | `LjU2i` | 배지 |
| BadgeAmber | `Lf3D8` | 배지 |
| BadgeRed | `hzePY` | 배지 |
| InputField | `bCOqB` | 폼 |
| SelectField | `eTLQz` | 폼 |
| TextareaField | `V2bAw` | 폼 |
| Checkbox | `QIABy` | 폼 |
| SurfaceCard | `XhIPy` | 레이아웃 |
| TableRow | `USM70` | 테이블 |
| Pagination | `gCB0G` | 네비게이션 |
| EmptyState | `rGfcB` | 상태 |
| FilterBar | `mqxGE` | 필터 |
| MsgBubbleMine | `3FdfH` | 메시지 |
| MsgBubbleTheirs | `vmmSO` | 메시지 |
| MainHeader | `pTkbs` | 셸 |
| AdminSidebar | `m6OMC` | 셸 |
