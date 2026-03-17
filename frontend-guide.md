[← Back to docs README](../README.md)

# Frontend Development Guide

> **프로젝트명**: remote-standard 프론트엔드
> **버전**: 1.0.0
> **마지막 수정일**: 2026-03-12

---

## 참조 문서

이 가이드를 사용하기 전에 다음 문서를 먼저 확인하세요:

| 문서 | 위치 | 설명 |
|------|------|------|
| **Architecture** | [../03-architecture/system-architecture.md](../03-architecture/system-architecture.md) | 시스템 아키텍처 및 설계 결정 |
| **PRD** | [../02-prd/prd-v2.0-core.md](../02-prd/prd-v2.0-core.md) | 제품 요구사항 및 기능 명세 |
| **Design System** | [design-system.md](design-system.md) | UI/UX 디자인 시스템 |

---

## 1. 프론트엔드 기술 스택

| 항목 | 선택 | 버전/설명 |
|------|------|-----------|
| **언어** | TypeScript | 5.3.x |
| **프레임워크** | React | 18.2+ |
| **빌드 도구** | Vite | 5.1+ |
| **패키지 매니저** | Yarn | 4.5.0 (Berry) |
| **모노레포** | Yarn Workspaces | 7개 워크스페이스 |
| **라우팅** | React Router | 6.22+ |
| **서버 상태 관리** | TanStack Query | 5.18+ |
| **클이언트 상태 관리** | Zustand | 4.5+ |
| **스타일링** | Emotion | CSS-in-JS |
| **UI 컴포넌트** | Radix UI + Tailwind | 접근성 기반 컴포넌트 |
| **폰트** | Noto Sans JP | 일본어/한국어 지원 |
| **다국어** | i18next | 국제화 지원 |
| **애니메이션** | Lottie-web | JSON 기반 애니메이션 |
| **HTTP 클라이언트** | axios | 1.6.7 |
| **날짜 처리** | dayjs | 1.11+ |
| **유틸리티** | lodash-es | 4.17+ |

---

## 2. 프로젝트 구조 (Yarn Workspaces)

```
frontend/
├── package.json              # 루트 워크스페이스 설정
├── yarn.lock                 # 의존성 잠금 파일
├── .yarnrc.yml               # Yarn 4 설정 (node-modules linker)
├── eslint.config.js          # 공통 ESLint 설정 (flat config)
├── .prettierrc.json          # 공통 Prettier 설정
├── tsconfig.base.json        # 공통 TypeScript 기본 설정
├── tsconfig.json             # 루트 TypeScript 설정 (프로젝트 참조)
│
├── packages/                 # 공유 패키지 (라이브러리)
│   ├── types/                # @remote-standard/types
│   │   └── src/              # 공유 TypeScript 타입 정의
│   │
│   ├── utils/                # @remote-standard/utils
│   │   └── src/              # API 클라이언트, 훅스, 유틸리티
│   │
│   ├── ui/                   # @remote-standard/ui
│   │   ├── components/       # Button, Input, Card, Modal 등
│   │   ├── chat/             # ChatPanel, MessageBubble 등
│   │   ├── auth/             # LoginForm, AuthLayout 등
│   │   └── theme/            # 디자인 시스템 테마, CSS 변수
│   │
│   └── config/               # @remote-standard/config
│       └── vite.app.base.ts  # 공유 Vite 설정 프리셋
│
├── agent-app/                # 상담사 앱 (port 3000)
│   ├── src/
│   │   ├── main.tsx          # React 엔트리 포인트
│   │   ├── App.tsx           # 루트 컴포넌트
│   │   ├── pages/            # 페이지 컴포넌트
│   │   └── styles/
│   │       └── global.css    # 전역 CSS 변수
│   ├── index.html            # Vite 엔트리 HTML
│   └── vite.config.ts        # 앱별 Vite 설정
│
├── guest-app/                # 고객 앱 (port 3001)
│   └── ...                   # 구조 동일
│
└── admin-app/                # 관리자 앱 (port 3002)
    └── ...                   # 구조 동일
```

### 워크스페이스 구성

| 워크스페이스 | 패키지명 | 타입 | 설명 |
|-------------|----------|------|------|
| packages/types | @remote-standard/types | 라이브러리 | 공유 TypeScript 타입 |
| packages/utils | @remote-standard/utils | 라이브러리 | API, 훅스, 유틸리티 |
| packages/ui | @remote-standard/ui | 라이브러리 | UI 컴포넌트, 테마 |
| packages/config | @remote-standard/config | 라이브러리 | Vite 설정 프리셋 |
| agent-app | agent-app | 애플리케이션 | 상담사 인터페이스 |
| guest-app | guest-app | 애플리케이션 | 고객 입장/참여 |
| admin-app | admin-app | 애플리케이션 | 관리자 대시보드 |

### 의존성 체인

```
@remote-standard/types
        ↓
@remote-standard/utils
        ↓
@remote-standard/ui
        ↓
   ┌────┴────┐
   ↓         ↓
agent-app  guest-app  admin-app
```

---

## 3. 개발 환경 설정

### 사전 요구사항

- **Node.js**: 20.0.0 이상
- **Yarn**: Corepack을 통해 자동 관리 (packageManager: yarn@4.5.0)

### 초기 설정

```bash
# 1. 저장소 클론 후 프론트엔드 디렉토리로 이동
cd frontend

# 2. 의존성 설치 (Yarn 4.5.0이 자동으로 설치됨)
yarn install

# 3. 워크스페이스 목록 확인
yarn workspaces list
```

---

## 4. 개발 명령어

### 루트에서 실행하는 명령어

```bash
# 모든 워크스페이스 빌드
yarn build

# 모든 워크스페이스 린트 검사
yarn lint

# 린트 자동 수정
yarn lint:fix

# 모든 워크스페이스 포맷 검사
yarn format

# 포맷 자동 수정
yarn format:fix

# 모든 워크스페이스 타입 검사
yarn type-check

# 개발 서버 실행 - 상담사 앱 (port 3000)
yarn dev:agent

# 개발 서버 실행 - 고객 앱 (port 3001)
yarn dev:guest

# 개발 서버 실행 - 관리자 앱 (port 3002)
yarn dev:admin

# 모든 워크스페이스 테스트 실행
yarn test

# 모든 워크스페이스 빌드 정리
yarn clean
```

### 개별 워크스페이스 명령어

```bash
# 특정 패키지 빌드
yarn workspace @remote-standard/types build
yarn workspace @remote-standard/utils build
yarn workspace @remote-standard/ui build

# 특정 앱 빌드
yarn workspace agent-app build
yarn workspace guest-app build
yarn workspace admin-app build

# 특정 앱 타입 검사
yarn workspace agent-app type-check
```

### CI 빌드 스크립트

저장소 루트에서 전체 프론트엔드 빌드를 실행하려면:

```bash
./scripts/build-frontend.sh
```

이 스크립트는 다음 순서로 실행됩니다:
1. `yarn lint` - ESLint 검사
2. `yarn format` - Prettier 포맷 검사
3. `yarn type-check` - TypeScript 타입 검사
4. `yarn build` - 프로덕션 빌드

---

## 5. 코딩 규칙

### 기본 원칙

| 항목 | 규칙 |
|------|------|
| **들여쓰기** | 2 spaces |
| **줄 길이** | 최대 100자 |
| **세미콜론** | 필수 |
| **따옴표** | 단일 따옴표 |
| **파일 네이밍** | kebab-case (예: user-profile.tsx) |
| **변수/함수** | camelCase |
| **컴포넌트/타입** | PascalCase |

### import 순서

```typescript
// 1. React imports
import React from 'react';
import { useState, useEffect } from 'react';

// 2. 외부 라이브러리
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// 3. 내부 워크스페이스 (@remote-standard/*)
import { Button } from '@remote-standard/ui';
import { useAuthStore } from '@remote-standard/utils';

// 4. 로컬 별칭 (@/*)
import { Dashboard } from '@/pages/Dashboard';
import { useChannel } from '@/hooks/useChannel';

// 5. 타입 imports
import type { Channel } from '@remote-standard/types';
```

### 컴포넌트 구조

```typescript
import React from 'react';
import { useState, useEffect } from 'react';

// 외부 라이브러리
import { useQuery } from '@tanstack/react-query';

// 내부 워크스페이스
import { Button, Card } from '@remote-standard/ui';
import { useChannelStore } from '@remote-standard/utils';

// 타입
interface ChannelProps {
  channelId: string;
  userId: string;
  onLeave: () => void;
}

// 컴포넌트
export function Channel({ channelId, userId, onLeave }: ChannelProps): JSX.Element {
  // 상태
  const [isConnected, setIsConnected] = useState(false);

  // store
  const { participants, joinChannel } = useChannelStore();

  // effect
  useEffect(() => {
    joinChannel(channelId, userId);
  }, [channelId, userId, joinChannel]);

  // render
  return (
    <div>
      <VideoGrid participants={participants} />
      <ChatPanel channelId={channelId} />
      <ControlBar onLeave={onLeave} />
    </div>
  );
}
```

---

## 6. 공유 패키지 개발 가이드

### @remote-standard/types

공유 TypeScript 타입 정의 패키지입니다.

```typescript
// 새로운 타입 추가 예시
// packages/types/src/channel.ts

export interface Channel {
  id: string;
  roomCode: string;
  status: ChannelStatus;
  createdAt: Date;
}

export type ChannelStatus = 'pending' | 'active' | 'ended';
```

빌드 시 `.d.ts` 선언 파일이 생성됩니다.

### @remote-standard/utils

API 클라이언트, 커스텀 훅스, 유틸리티 함수를 포함합니다.

**주요 모듈:**
- `api.ts` - Axios 인스턴스 설정 (토큰 갱신 인터셉터)
- `auth-api.ts`, `channel-api.ts`, `chat-api.ts` - 도메인별 API
- `stores/` - Zustand 상태 저장소
- `hooks/` - React 커스텀 훅스

### @remote-standard/ui

UI 컴포넌트와 테마 시스템을 포함합니다.

**구조:**
- `components/` - Button, Input, Card, Modal 등 기본 컴포넌트
- `chat/` - 채팅 관련 컴포넌트
- `auth/` - 인증 관련 컴포넌트
- `theme/index.ts` - 디자인 시스템 테마, CSS 변수, Emotion 통합

**테마 사용 예시:**

```typescript
import { cssVariables, injectThemeVariables, emotionTheme } from '@remote-standard/ui/theme';

// CSS 변수 주입
injectThemeVariables();

// Emotion styled component에서 사용
const StyledButton = styled.button`
  background: ${props => props.theme.colors.accent.terracotta};
`;
```

### @remote-standard/config

Vite 설정 프리셋을 제공합니다.

```typescript
// agent-app/vite.config.ts
import { defineConfig } from 'vite';
import { createAppConfig } from '../packages/config/vite.app.base.ts';

export default defineConfig(createAppConfig({
  port: 3000,
  appName: 'agent-app'
}));
```

---

## 7. 애플리케이션 개발

### agent-app (상담사)

**포트**: 3000

**주요 기능:**
- 채널 생성/관리
- 화면 공유 (송출)
- 참여자 관리
- 채팅 관리

**실행:**
```bash
yarn dev:agent
```

### guest-app (고객)

**포트**: 3001

**주요 기능:**
- RoomCode로 채널 입장
- 화면 보기 (수신)
- 채팅 참여
- 음성/영상 송출

**실행:**
```bash
yarn dev:guest
```

### admin-app (관리자)

**포트**: 3002

**주요 기능:**
- 사용자 관리
- 상담 이력 조회
- 통계/대시보드

**실행:**
```bash
yarn dev:admin
```

---

## 8. 성능 최적화

- 이미지는 lazy loading 적용
- WebSocket 연결은 컴포넌트 unmount 시 해제
- 메모이제이션 적극 활용 (`useMemo`, `useCallback`)
- Vite의 코드 분할 (manual chunks: vendor, emotion, router, query)

---

## 9. 알려진 제한사항

| 문제 | 영향 | 상태 |
|------|------|------|
| **Agent App 브라우저 QA** | 로컬 Playwright/Chrome 세션 충돌로 브라우저 테스트 실행 불가 | 빌드 및 타입 검사는 정상 통과. CI 환경에서 테스트 권장 |

---

## 10. 자주 발생하는 문제

### WebRTC 연결 실패

**증상:** 피어 간 연결이 수립되지 않음

**원인:** NAT/Firewall 환경, STUN/TURN 서버 설정 누락, ICE candidate 교환 실패

**해결책:**
```typescript
// TURN 서버 설정 확인
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'user',
      credential: 'pass'
    }
  ]
});

// ICE candidate 이벤트 모니터링
pc.onicecandidate = (event) => {
  if (event.candidate) {
    signalingServer.send({
      type: 'ice-candidate',
      candidate: event.candidate
    });
  }
};
```

### WebSocket 연결 끊김

**증상:** 실시간 기능이 갑자기 중단됨

**원인:** 네트워크 불안정, 서버 재시작, 브라우저 슬립 모드

**해결책:**
```typescript
// 자동 재연결 로직
useEffect(() => {
  let ws: WebSocket;
  let reconnectTimer: NodeJS.Timeout;

  const connect = () => {
    ws = new WebSocket(WS_URL);

    ws.onclose = () => {
      reconnectTimer = setTimeout(connect, 3000);
    };
  };

  connect();

  return () => {
    clearTimeout(reconnectTimer);
    ws?.close();
  };
}, []);
```

### 메모리 누수

**증상:** 페이지 사용 시 메모리 사용량 지속적 증가

**원인:** 이벤트 리스너 미해제, 타이머/인터벌 미정리, 클로저로 인한 참조 유지

**해결책:**
```typescript
// cleanup 함수 사용
useEffect(() => {
  const handleResize = () => {
    // 리사이즈 처리
  };

  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);

// 타이머 정리
useEffect(() => {
  const timer = setInterval(() => {
    // 주기적 작업
  }, 1000);

  return () => clearInterval(timer);
}, []);
```

### CORS 오류

**증상:** API 호출 시 CORS 에러 발생

**원인:** 직접 백엔드 API 호출, 잘못된 프록시 설정

**해결책:**
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
});
```

---

## 11. 용어 표준

| 용어 | 정의 | 사용 맥락 |
|------|------|-----------|
| **Channel** | 실시간 상담이 이루어지는 세션 공간 | Aggregate Root |
| **RoomCode** | 6자리 숫자 코드 (예: 123456) | Value Object, 입장용 |
| **Session** | Channel의 활성 상태 | 상태 관리 |
| **Endpoint** | Channel 참여자 (Agent/Guest) | WebRTC 용어 |

---

> **문서 버전**: 1.0.0
> **마지막 업데이트**: 2026-03-12
