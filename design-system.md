# Design System - Remote Standard

> **버전**: 1.0.0  
> **작성일**: 2026-02-27  
> **상태**: Approved  
> **설계 철학**: Warm Depth (Soft minimalism + Warm depth)

---

## 1. 디자인 철학

### 1.1 목표

원격 상담 플랫폼에서 고객과 상담사가 편안하게 소통할 수 있는 UI 시스템을 제공합니다.

- **정보 흐름 유지**: 탐색 > 이해 > 결정 흐름이 막히지 않도록 설계
- **편안한 분위기**: 차분한 Warm Neutral 톤 위에 부드러운 depth(레이어/그림자)로 공간 분리
- **신뢰 구축**: 상담이라는 민감한 상황에서 안정감을 주는 시각적 언어
- **장기적 일관성**: 3년 이상 유지 가능한 브랜드 중심 시스템화

### 1.2 비목표 (Non-goals)

- 단순 미려함만을 위한 장식적 UI 금지
- 데이터/콘텐츠 구조가 불명확한 "감성만 있는 페이지" 금지
- 과도한 대비(순백/순흑), 과한 포화도, 과도한 3D 오브젝트 남발 금지
- "AI 느낌 / 일반 SaaS 템플릿" 금지
  - 과한 네온/글로우/유리질(Glass 과다)
  - 과도한 그라데이션 배경
  - 흔한 bento 템플릿 복제
  - 모든 카드가 동일한 강도/동일한 그림자를 가진 기계적 반복

### 1.3 브랜드 무드 & 경험 설계 키워드

| 키워드 | 설명 |
|--------|------|
| **Warm** | 따뜻하고 친근한 느낌 |
| **Calm** | 차분하고 안정적인 분위기 |
| **Trustworthy** | 신뢰할 수 있는 전문성 |
| **Curated** | 정제된, 세심하게 다듬어진 |

- **"정제된 친절함"**: 설명은 많아도 한 번에 하나씩 보이도록 단계화
- **"소프트한 자신감"**: CTA는 강요하지 않고 선택이 쉬운 구조로 설득

---

## 2. 레이아웃 시스템

### 2.1 그리드

| 디바이스 | 컬럼 | 최대 너비 | 거터 |
|----------|------|-----------|------|
| Desktop | 12 columns | 1200~1280px | 24px |
| Tablet | 8 columns | 960px | 20px |
| Mobile | 4 columns | 100% | 16px |

### 2.2 섹션 간격 (Vertical Rhythm)

- 섹션 상/하 padding:
  - Desktop: 96px
  - Tablet: 72px
  - Mobile: 56px
- 카드 그룹 낵부 간격: 16~24px
- 정보 밀도가 높은 구역은 "밀도 조절 레이어" 사용
  - `dense` 영역: 글줄 간격/카드 패딩 10~15% 축소, 대신 구분선/톤으로 구획

### 2.3 컨테이너 규칙

- 텍스트 읽기 최적 line-length: 52~72자 (한글 기준 체감)
- Hero headline은 한 줄에 끝낼려 하지 말고 의도적 줄바꿈으로 리듬 만들기

### 2.4 페이지 구조 (원격 상담 플랫폼)

```
AppLayout
├── Header
│   ├── BrandMark (Logo)
│   ├── PrimaryNav (상담 목록, 설정 등)
│   └── UtilityNav (알림, 프로필)
├── Main
│   ├── ConsultationRoom (실제 상담 화면)
│   │   ├── VideoArea (상담사/고객 화상)
│   │   ├── ControlBar (통화 제어)
│   │   ├── ChatPanel (실시간 채팅)
│   │   └── ScreenShareArea (화면 공유)
│   ├── Dashboard (상담사 메인)
│   │   ├── ChannelList (상담 채널 목록)
│   │   └── StatusSummary (상태 요약)
│   └── AdminDashboard (관리자 대시보드)
│       ├── Statistics (통계)
│       └── UserManagement (사용자 관리)
└── Footer (선택적)
```

---

## 3. 타이포그래피 시스템

### 3.1 타입 역할

- **Display (Hero)**: 감성/브랜드 톤 담당 (너무 장식적이면 신뢰도 하락 > 절제)
- **Body**: 가독성/정보 전달 담당

### 3.2 권장 스케일

| 스타일 | 크기 | 용도 |
|--------|------|------|
| Display XL | 56–72 (clamp) | 랜딩 페이지 Hero |
| H1 | 40–48 | 페이지 타이틀 |
| H2 | 28–32 | 섹션 헤더 |
| H3 | 22–24 | 카드 타이틀 |
| Body L | 18 | 강조 본문 |
| Body M | 16 | 기본 본문 |
| Caption | 13–14 | 보조 텍스트, 라벨 |

### 3.3 라인높이

| 유형 | 라인높이 |
|------|----------|
| Display | 1.05–1.15 |
| Heading | 1.2–1.3 |
| Body | 1.55–1.7 |
| Caption | 1.4–1.5 |

### 3.4 숫자/지표 타이포

- 지표 숫자는 **탭형 숫자(tabular nums)** 권장: `font-variant-numeric: tabular-nums;`
- "숫자 + 단위"는 같은 크기로 두지 말고 단위를 70~80%로 축소하여 스캔성 강화

---

## 4. 컬러 시스템

### 4.1 기본 컨셉

- Warm Neutral을 "표면(Background/Surface)" 레이어로 분리해 depth를 만든다
- Accent는 강조가 아니라 **정보 그룹핑/카테고리 인지** 용도로만 사용(면적 제한)

### 4.2 팔레트

#### Base (배경)

| 토큰 | HEX | 용도 |
|------|-----|------|
| `--bg` | #FBF8F3 | 기본 배경 (warm off-white) |
| `--surface-1` | #FFFFFF | 카드, 팝업 표면 |
| `--surface-2` | #F6F0E8 | 보조 표면, 구분 영역 |
| `--surface-3` | #EFE7DD | 강조 표면, 활성 상태 |
| `--border` | rgba(32, 26, 20, 0.10) | 테두리, 구분선 |

#### Text (텍스트)

| 토큰 | HEX | 용도 |
|------|-----|------|
| `--text-strong` | #201A14 | 주요 텍스트 (heading, strong) |
| `--text` | #3A322A | 기본 본문 텍스트 |
| `--text-muted` | #6D6257 | 보조 텍스트, placeholder |

#### Accent (강조색)

| 토큰 | HEX | 용도 |
|------|-----|------|
| `--accent-terracotta` | #C97A56 | 주요 강조 (버튼, 활성 상태) |
| `--accent-sage` | #7AA592 | 성공, 안정 상태 |
| `--accent-sky` | #7AA2BF | 정보, 링크 |
| `--accent-lavender` | #A79BC9 | 특수 카테고리 |

### 4.3 상태 색상

| 상태 | HEX | 용도 |
|------|-----|------|
| `--status-online` | #7AA592 | 상담사 접속 중 |
| `--status-busy` | #C97A56 | 상담 중 |
| `--status-offline` | #6D6257 | 오프라인 |
| `--status-error` | #C95656 | 오류, 경고 |
| `--status-warning` | #D4A34B | 주의 |

### 4.4 사용 규칙

- Accent는 "면"으로 쓸 때 6–14% tint로 제한
- 텍스트는 Accent 위에 바로 올리지 말고:
  - (1) 배경을 충분히 옅게 만들거나
  - (2) 텍스트는 Neutral로 유지하고 "태그/아이콘/좌측 바(bar)"에만 Accent 적용
- 대비: WCAG 기준(텍스트/아이콘) 준수
- "고대비 금지"는 **눈부심을 줄이는 톤 설계**이지, 접근성을 포기하는 뜻이 아니다

---

## 5. UI Shape Language

### 5.1 Radius

| 요소 | Radius | 설명 |
|------|--------|------|
| 카드 | 20px | (허용 16–24) |
| 버튼 (fill) | 999px | 완전 둥근 pill 형태 |
| 입력창 | 16–18px | 부드러운 모서리 |
| 비디오 컨테이너 | 16px | 화상 통화 영역 |
| 채팅 버블 | 16px | 메시지 말풍선 |

### 5.2 Shadow

- Soft shadow 사용
- 그림자 색은 순검정 대신 **웜한 잉크 톤** (텍스트 컬러 기반 알파)으로

```css
--shadow-1: 0 1px 3px rgba(32, 26, 20, 0.08);
--shadow-2: 0 4px 12px rgba(32, 26, 20, 0.10);
--shadow-3: 0 8px 24px rgba(32, 26, 20, 0.12);
```

### 5.3 카드형 정보 분리

- "정보 단위 = 카드" 원칙 유지
- 단, 모든 카드가 같은 elevation이면 템플릿 느낌 > **우선순위에 따라 레벨 분리**

---

## 6. 컴포넌트 사양

### 6.1 Button (Pill)

#### Variants

| 변형 | 스타일 | 사용 예 |
|------|--------|---------|
| `primary` | accent fill + neutral text | 주요 액션 (상담 시작, 접수) |
| `secondary` | surface + border | 보조 액션 (취소, 뒤로) |
| `ghost` | 투명 + hover 배경 tint | 아이콘 버튼, toolbar |
| `danger` | 경고 톤 | 종료, 삭제 (절제된 사용) |

#### Sizes

| 사이즈 | 높이 | 패딩 | 용도 |
|--------|------|------|------|
| `sm` | 32px | 12px 16px | 도구 모음, 보조 액션 |
| `md` | 40px | 12px 20px | 기본 버튼 |
| `lg` | 48px | 14px 28px | 주요 CTA |

#### States

- default / hover(soft lift) / active(press) / disabled / loading

#### Interaction

- hover: shadow +1단계, bg 약간 따뜻해짐
- active: translateY 1px (과하지 않게)
- focus-visible: outline(soft ring)

#### A11y

- 최소 터치 타겟 44px
- `aria-busy`/`aria-disabled` 처리

---

### 6.2 Card

#### 카드 레벨

| 레벨 | 특징 | 사용 예 |
|------|------|---------|
| Level 1 (Hero/핵심) | 가장 깊은 depth, 패딩 큼 | 상담 방 메인 카드, 대시보드 요약 |
| Level 2 (섹션 기본) | 중간 depth | 채널 리스트 카드, 채팅 패널 |
| Level 3 (리스트/대량) | 얕은 depth + border 중심 | 메시지 목록, 작은 아이템 |

#### 내부 구조 규칙

```
Card
├── Header (옵션)
│   ├── Title
│   └── Action
├── Content
│   ├── Key Value (숫자/태그)
│   ├── Supporting text (최대 2줄)
│   └── CTA (텍스트 링크/버튼)
└── Footer (옵션)
```

#### A11y

- 카드 전체 클릭이면 내부 링크/버튼 충돌 방지(한 가지 클릭 규칙)
- hover만으로 정보가 사라지지 않게(키보드 접근 동일 UX)

---

### 6.3 Input

#### Variants

| 변형 | 스타일 | 사용 예 |
|------|--------|---------|
| `default` | border 기본 | 일반 입력 |
| `filled` | surface-2 배경 | 검색, 채팅 입력 |
| `underline` | 하단 border만 | 로그인 폼 (미니멀) |

#### States

- default / focus / error / disabled / readonly

#### 원격 상담 특화

- **채팅 입력창**: Pill 형태, 전송 버튼 통합
- **RoomCode 입력**: 6자리 숫자 전용, 자동 포커스 이동
- **검색 입력**: 자동완성, 히스토리 표시

#### A11y

- 모든 입력 필드에 label 제공
- placeholder는 예시용, label은 필수
- error 메시지 연결: `aria-describedby`

---

### 6.4 Tag/Chip

#### Variants

| 변형 | 스타일 | 사용 예 |
|------|--------|---------|
| `default` | surface + border | 기본 태그 |
| `accent` | accent 배경 | 강조 태그 |
| `status` | 상태색 배경 | 접속 상태, 상담 상태 |
| `removable` | 닫기 버튼 포함 | 필터 태그 |

#### Sizes

| 사이즈 | 높이 | 용도 |
|--------|------|------|
| `sm` | 24px | 리스트 내 태그 |
| `md` | 28px | 필터, 카테고리 |

---

### 6.5 Video UI Components

#### VideoContainer

```
VideoContainer
├── VideoStream (WebRTC)
├── OverlayControls
│   ├── MicToggle
│   ├── CameraToggle
│   └── ScreenShareToggle
├── ParticipantInfo
│   ├── Name
│   ├── StatusIndicator
│   └── NetworkQuality
└── Placeholder (비디오 off 시)
```

#### 스펙

| 속성 | 값 | 설명 |
|------|-----|------|
| Border radius | 16px | 부드러운 모서리 |
| Aspect ratio | 16:9 또는 4:3 | 상황에 따라 |
| Overlay | 40% 투명도 | 어두운 오버레이 위에 컨트롤 |
| Background | `--surface-3` | 비디오 off 시 배경 |

#### ControlBar

| 아이템 | 아이콘 | 기능 |
|--------|--------|------|
| 마이크 | Mic/MicOff | 음성 on/off |
| 카메라 | Videocam/VideocamOff | 화상 on/off |
| 화면 공유 | ScreenShare | 화면 공유 시작/중지 |
| 설정 | Settings | 장치 설정 |
| 종료 | CallEnd | 통화 종료 (danger 색상) |

---

### 6.6 Chat UI Components

#### ChatPanel

```
ChatPanel
├── Header
│   ├── Title
│   └── ParticipantCount
├── MessageList
│   └── Message[]
│       ├── Avatar (옵션)
│       ├── Bubble
│       └── Timestamp
└── InputArea
    ├── TextInput
    ├── SendButton
    └── AttachmentButton
```

#### MessageBubble

| 속성 | 상담사 | 고객 |
|------|--------|------|
| 정렬 | 좌측 | 우측 |
| 배경 | `--surface-2` | `--accent-sky` (tinted) |
| Radius | 16px (왼쪽 하단 4px) | 16px (오른쪽 하단 4px) |
| 텍스트 색 | `--text` | `--text-strong` |

#### 스펙

- 메시지 간격: 8px
- 그룹 메시지 간격: 16px
- 타임스탬프: Caption 사이즈, `--text-muted`
- 읽음 표시: 작은 체크 아이콘

---

### 6.7 ChannelCard (상담 채널 카드)

```
ChannelCard
├── StatusIndicator (접속 상태)
├── ChannelInfo
│   ├── RoomCode (6자리)
│   ├── ChannelName
│   └── CreatedAt
├── ParticipantPreview
│   ├── AgentAvatar
│   └── GuestAvatar (옵션)
├── Metrics
│   ├── Duration
│   └── MessageCount
└── Actions
    ├── EnterButton
    └── MoreOptions
```

#### 상태별 표시

| 상태 | 색상 | 인디케이터 |
|------|------|------------|
| 대기 중 | `--status-online` | 녹색 점 |
| 상담 중 | `--accent-terracotta` | 주황색 점 |
| 종료됨 | `--text-muted` | 회색 점 |

---

### 6.8 FilterBar

#### 구성

```
FilterBar
├── SearchInput
├── FilterChips
│   ├── StatusFilter (대기/진행/종료)
│   ├── DateFilter
│   └── TypeFilter
└── SortSelect
```

#### 상태

- 기본 / 적용됨(활성 칩) / 초기화(Reset) / 결과 없음(EmptyState) / 로딩(Skeleton)

#### 모바일

- Desktop: 상단 sticky 가능
- Mobile: 요약 바 + "필터 열기" 버튼 > BottomSheet

#### A11y

- 칩은 버튼 역할(`button`) + `aria-pressed`
- 검색은 `label` 제공 + `type="search"` 권장
- sticky 사용 시 스킵링크/포커스 이동 고려

---

### 6.9 Modal / BottomSheet

#### Modal

| 속성 | 값 |
|------|-----|
| 배경 | `--surface-1` |
| Radius | 20px |
| Shadow | `--shadow-3` |
| Padding | 24px |
| Max-width | 480px (모바일: 100%) |

#### BottomSheet (모바일)

| 속성 | 값 |
|------|-----|
| 배경 | `--surface-1` |
| Radius | 20px (상단만) |
| Handle bar | 40px x 4px, `--surface-3` |

---

### 6.10 Toast

| 속성 | 값 |
|------|-----|
| 배경 | `--surface-2` |
| Radius | 12px |
| Position | 하단 중앙 또는 우측 상단 |
| Duration | 3초 (액션 없음), 5초 (액션 있음) |
| Max-width | 400px |

#### Variants

| 타입 | 색상 | 사용 예 |
|------|------|---------|
| `info` | `--accent-sky` | 알림, 안내 |
| `success` | `--accent-sage` | 상담 시작, 접수 완료 |
| `warning` | `--status-warning` | 연결 불안정 |
| `error` | `--status-error` | 연결 끊김, 오류 |

---

### 6.11 Skeleton

- 로딩 상태 표시
- 실제 콘텐츠와 동일한 레이아웃 유지
- shimmer 애니메이션 사용
- 배경: `--surface-2`
- 애니메이션: 1.5s linear infinite

---

### 6.12 EmptyState

| 요소 | 스타일 |
|------|--------|
| 아이콘 | 64px, `--text-muted` |
| 타이틀 | H3, `--text-strong` |
| 설명 | Body M, `--text-muted` |
| 액션 | Secondary 버튼 (옵션) |

---

## 7. 원격 상담 특화 UI 패턴

### 7.1 상담 방 (Consultation Room) 레이아웃

#### Desktop (1280px+)

```
┌─────────────────────────────────────────────────────────┐
│  [Header: Logo | 상담중 | 설정 | 프로필]                 │
├─────────────────────────────────────┬───────────────────┤
│                                     │                   │
│         [Video: 상담사/고객]        │   [ChatPanel]     │
│                                     │                   │
│                                     │   - 메시지 목록   │
│         (16:9 비율)                 │   - 입력창        │
│                                     │                   │
├─────────────────────────────────────┤                   │
│  [ScreenShare: 화면 공유 영역]      │                   │
│  (활성화 시 표시)                   │                   │
├─────────────────────────────────────┴───────────────────┤
│  [ControlBar: 마이크 | 카메라 | 화면공유 | 종료]        │
└─────────────────────────────────────────────────────────┘
```

#### Tablet (768px - 1279px)

```
┌─────────────────────────────────────────┐
│  [Header]                               │
├─────────────────────────────────────────┤
│  [Video: 상담사/고객]                   │
├─────────────────────────────────────────┤
│  [ChatPanel - Collapsible]              │
│  (토글로 접기/펼치기)                   │
├─────────────────────────────────────────┤
│  [ControlBar]                           │
└─────────────────────────────────────────┘
```

#### Mobile (< 768px)

```
┌─────────────────────────┐
│  [Header]               │
├─────────────────────────┤
│                         │
│  [Video]                │
│  (전체 화면)            │
│                         │
├─────────────────────────┤
│  [ControlBar]           │
├─────────────────────────┤
│  [ChatButton - Floating]│
│  (채팅 패널 오버레이)   │
└─────────────────────────┘
```

### 7.2 대시보드 레이아웃

#### 상담사 대시보드

```
┌─────────────────────────────────────────┐
│  [Header]                               │
├──────────────┬──────────────────────────┤
│              │                          │
│  [Sidebar]   │   [ChannelList]          │
│  - 프로필    │   - 필터바               │
│  - 상태      │   - 채널 카드 그리드     │
│  - 통계     │   - 페이지네이션         │
│              │                          │
│              │   [EmptyState]           │
│              │   (상담 없을 때)         │
│              │                          │
└──────────────┴──────────────────────────┘
```

### 7.3 화면 공유 UI

#### 공유 선택 모달

```
[화면 공유 선택]
┌─────────────────────────────────┐
│  전체 화면    |    창/애플리케이션  │
├─────────────────────────────────┤
│  [미리보기 1] [미리보기 2] ...    │
│                                 │
│  [공유 시작] [취소]              │
└─────────────────────────────────┘
```

#### 공유 중 표시

- 상단 배너: "화면을 공유 중입니다"
- 정지 버튼: 항상 표시
- 참여자 썸네일: 우측 하단 미니멀 표시

---

## 8. 모션 시스템

### 8.1 모션 원칙

- 정보 읽기를 방해하지 않는 "부드러운 등장/강조"
- 과한 패럴럭스/과한 튀는 easing 금지
- 사용자가 원하면 줄어야 함: `prefers-reduced-motion` 준수

### 8.2 기본 모션 프리셋

```css
/* Enter */
@keyframes enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Specs */
--duration-enter: 0.45s;
--duration-hover: 0.2s;
--easing-default: cubic-bezier(0.25, 0.1, 0.25, 1);
--stagger-delay: 0.08s;
```

### 8.3 컴포넌트별 모션

| 컴포넌트 | 애니메이션 | duration |
|----------|-----------|----------|
| Modal | fade + scale(0.95→1) | 0.3s |
| Toast | slide-up + fade | 0.3s |
| Card hover | lift + shadow | 0.2s |
| Button hover | bg-color + shadow | 0.2s |
| Message | slide-in (방향: 발신자 기준) | 0.3s |
| ChannelList | stagger enter | 0.45s + stagger |

### 8.4 Hover Micro-interaction

- 카드: shadow + 살짝 lift(1~2px)
- 버튼: 배경톤 변화 + 미세한 scale(1.01 이하) 또는 translateY(-1px)
- 아이콘 버튼: opacity + scale

### 8.5 상담 특화 모션

#### 비디오 연결

```
[연결 중]
  - Spinner: 회전 애니메이션
  - 텍스트: "상담사와 연결 중..." (점점점 애니메이션)
  - Progress bar: 좌→우 (2-3초)

[연결 완료]
  - 페이드 인: 0.3s
  - 상대방 비디오: scale(0.95→1) + opacity
```

#### 채팅 메시지

```
[메시지 전송]
  - 입력창: height 변화 (0.2s)
  - 버블: slide-in from bottom (0.3s)
  - 새 메시지 알림: bounce (0.4s)

[메시지 수신]
  - 버블: slide-in from top (0.3s)
  - 아바타: scale(0→1) (0.2s)
```

#### 화면 공유

```
[공유 시작]
  - Modal: fade + scale (0.3s)
  - 공유 영역: fade in (0.4s)
  - 컨트롤 바: slide-up (0.3s)

[공유 중]
  - 공유 표시: pulse animation (무한)

[공유 종료]
  - 페이드 아웃: 0.2s
```

---

## 9. 반응형 디자인

### 9.1 브레이크포인트

| 이름 | 값 | 주요 변화 |
|------|-----|-----------|
| `sm` | 480px | 모바일 최적화 |
| `md` | 768px | 태블릿, 사이드바 축소 |
| `lg` | 1024px | 데스크탑 기본 |
| `xl` | 1280px | 넓은 화면, 전체 레이아웃 |

### 9.2 모바일 우선 규칙

| 컴포넌트 | Desktop | Tablet | Mobile |
|----------|---------|--------|--------|
| FilterBar | 상단 sticky | 상단 sticky | "요약 + 열기" |
| 카드 그리드 | 3~4열 | 2열 | 1열 |
| ChatPanel | 우측 고정 | Collapsible | 오버레이 |
| VideoContainer | 16:9 | 4:3 | 전체 화면 |
| ControlBar | 하단 고정 | 하단 고정 | 하단 고정 (compact) |
| Sidebar | 표시 | 축소 | 숨김 (햄버거 메뉴) |

### 9.3 터치 타겟

- 최소 터치 타겟: 44x44px
- 권장 터치 타겟: 48x48px
- 컨트롤 간 간격: 최소 8px

---

## 10. 접근성 (A11y)

### 10.1 WCAG 2.1 AA 준수 체크리스트

#### 키보드 네비게이션

- [ ] 모든 인터랙션 요소: 키보드 탭 이동 가능
- [ ] `:focus-visible` 제공(soft ring)
- [ ] 포커스 순서가 논리적
- [ ] Esc 키로 Modal/BottomSheet 닫기
- [ ] Trap focus in Modal

#### 시각적 접근성

- [ ] 색만으로 상태 전달 금지(아이콘/텍스트 병행)
- [ ] 텍스트 대비: 4.5:1 (본문), 3:1 (큰 텍스트)
- [ ] 폼 요소: label 명시
- [ ] 에러 메시지: 명확하고 구체적

#### 동작/모션

- [ ] 모션: `prefers-reduced-motion`에서 애니메이션 최소화
- [ ] 자동 재생 콘텐츠: 정지/일시정지 제공
- [ ] 시간 제한: 연장 가능 또는 제거

#### 스크린 리더

- [ ] 이미지: 적절한 alt 텍스트
- [ ] 아이콘: 의미 있는 aria-label
- [ ] 상태 변경: aria-live 영역으로 알림
- [ ] 무한 스크롤: Load more 버튼 + SR 라이브 영역

#### 기타

- [ ] 터치 타겟: 최소 44px
- [ ] 스켈레톤/로딩: 화면 점프 최소화(레이아웃 유지)
- [ ] 언어: `lang` 속성 명시

### 10.2 상담 특화 접근성

#### 비디오 통화

- [ ] 자막/수어 통역 지원 (향후)
- [ ] 화면 공유 시 음성 설명
- [ ] 키보드 단축키 제공 (음성 on/off 등)

#### 채팅

- [ ] 메시지 읽음 확인 (시각적 + 스크린 리더)
- [ ] 파일 첨부 시 설명 텍스트
- [ ] 이모티콘 대체 텍스트

#### RoomCode 입력

- [ ] 숫자 입력 힌트
- [ ] 오류 시 구체적 안내
- [ ] 붙여넣기 지원

---

## 11. 콘텐츠 가이드

### 11.1 톤 앤 매너

| 상황 | 톤 | 예시 |
|------|-----|------|
| 환영 | 따뜻하고 친근한 | "안녕하세요, 상담을 시작하겠습니다." |
| 안내 | 명확하고 단순한 | "아래 버튼을 눌러 화면을 공유해 주세요." |
| 오류 | 침착하고 해결책 제시 | "연결이 불안정합니다. 잠시 후 다시 시도해 주세요." |
| 종료 | 감사하고 따뜻한 | "상담이 종료되었습니다. 좋은 하루 되세요." |

### 11.2 언어

- 공손하지만 딱딱하지 않은 반말/존댓말
- 기술 용어 최소화
- 약어 사용 시 첫 등장에서 설명

### 11.3 문구 패턴

#### 버튼

| 액션 | 문구 |
|------|------|
| 상담 시작 | "상담 시작하기" |
| 방 입장 | "방 입장하기" |
| 화면 공유 | "화면 공유하기" |
| 종료 | "상담 종료" |
| 취소 | "취소" |
| 확인 | "확인" |

#### 상태 메시지

| 상태 | 메시지 |
|------|--------|
| 연결 중 | "연결 중..." |
| 상담 중 | "상담 진행 중" |
| 대기 중 | "상담사를 기다리는 중..." |
| 종료됨 | "상담이 종료되었습니다" |
| 오류 | "연결에 실패했습니다. 다시 시도해 주세요." |

---

## 12. QA 가이드라인

### 12.1 디자인 QA

- [ ] 섹션마다 "핵심 문장 1개"가 첫 화면에서 보이는가?
- [ ] 카드 레벨(depth)이 정보 우선순위와 일치하는가?
- [ ] Accent가 장식이 아니라 "그룹핑/인지"에 쓰였는가?
- [ ] 모바일에서 필터/검색이 과밀하지 않은가?
- [ ] 상담 방 레이아웃이 직관적인가?
- [ ] 채팅 메시지가 구분이 잘 되는가?

### 12.2 프론트 QA

- [ ] prefers-reduced-motion에서 모션이 절제되는가?
- [ ] 키보드 포커스 이동이 자연스러운가?
- [ ] 무한 스크롤 + Load more fallback이 모두 동작하는가?
- [ ] 이미지/3D 리소스는 lazy-load/최적화 되어 있는가?
- [ ] 비디오/오디오 권한 요청이 적절한가?
- [ ] WebRTC 연결이 끊어졌을 때 우아하게 처리되는가?
- [ ] 채팅 메시지가 실시간으로 동기화되는가?

### 12.3 접근성 QA

- [ ] 스크린 리더로 모든 기능을 사용할 수 있는가?
- [ ] 색맹/색약 사용자도 상태를 구분할 수 있는가?
- [ ] 줌 200%에서 레이아웃이 깨지지 않는가?
- [ ] 키보드만으로 모든 작업을 완료할 수 있는가?

---

## 13. "템플릿 느낌"을 제거하는 디테일 규칙

- 카드/버튼을 동일한 그림자 강도로 복제하지 말고, **정보 등급**에 따라 elevation 차등
- 섹션 헤더를 매번 같은 패턴으로 반복하지 말고:
  - 어떤 섹션은 "짧은 선언문 + 메타"
  - 어떤 섹션은 "질문형 헤드라인 + 요약"
  - 어떤 섹션은 "지표 스트립"으로 변주
- 배경은 화려한 그라데이션 대신 "따뜻한 표면 레이어 + subtle tint"로 브랜드 결 유지
- 마이크로 인터랙션은 '보여주기'가 아니라 '이해를 돕는 신호'로만 사용
- 상담이라는 특수한 상황을 고려하여, 긴급하거나 강압적인 느낌이 들지 않도록 주의

---

## 14. 구현 참고사항

### 14.1 CSS 변수

```css
:root {
  /* Colors */
  --bg: #FBF8F3;
  --surface-1: #FFFFFF;
  --surface-2: #F6F0E8;
  --surface-3: #EFE7DD;
  --border: rgba(32, 26, 20, 0.10);
  
  --text-strong: #201A14;
  --text: #3A322A;
  --text-muted: #6D6257;
  
  --accent-terracotta: #C97A56;
  --accent-sage: #7AA592;
  --accent-sky: #7AA2BF;
  --accent-lavender: #A79BC9;
  
  /* Shadows */
  --shadow-1: 0 1px 3px rgba(32, 26, 20, 0.08);
  --shadow-2: 0 4px 12px rgba(32, 26, 20, 0.10);
  --shadow-3: 0 8px 24px rgba(32, 26, 20, 0.12);
  
  /* Motion */
  --duration-fast: 0.2s;
  --duration-normal: 0.3s;
  --duration-slow: 0.45s;
  --easing-default: cubic-bezier(0.25, 0.1, 0.25, 1);
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
}
```

### 14.2 Emotion 스타일 예시

```typescript
import styled from '@emotion/styled';

export const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  padding: 12px 20px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ variant = 'primary' }) =>
    variant === 'primary'
      ? `
        background: var(--accent-terracotta);
        color: white;
        border: none;
        
        &:hover {
          box-shadow: var(--shadow-2);
          transform: translateY(-1px);
        }
      `
      : `
        background: var(--surface-1);
        color: var(--text);
        border: 1px solid var(--border);
        
        &:hover {
          background: var(--surface-2);
        }
      `}
  
  &:active {
    transform: translateY(1px);
  }
  
  &:focus-visible {
    outline: 2px solid var(--accent-terracotta);
    outline-offset: 2px;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0.0 | 2026-02-27 | 초기 작성, Warm Depth 디자인 시스템 적용, 원격 상담 플랫폼 특화 UI 추가 |

---

**문서 버전**: 1.0.0  
**마지막 업데이트**: 2026-02-27
