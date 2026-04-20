# 외부 접속 가이드 — 공유기 정적 포트 포워딩

이 문서는 FSM 앱을 공인 IP 로 **영구 노출** 하기 위한 설정 가이드. UPnP 로 임시 매핑해 두면 공유기/Mac 재부팅 시 사라지므로, 한 번 정적 포워딩을 걸어두면 더 이상 신경 쓸 필요가 없다.

---

## 현재 네트워크 정보

| 항목 | 값 |
|------|----|
| LAN IP (Mac en0) | `172.30.1.81` |
| 공유기 게이트웨이 | `172.30.1.254` |
| 공인 IP (ExternalIPAddress) | `121.133.86.173` |
| 공유기 관리자 페이지 | `http://172.30.1.254` |

> Mac 의 LAN IP 는 DHCP 임대이므로 바뀔 수 있다. 이 문서의 `172.30.1.81` 자리에는 현재 값을 넣어 확인하자 (`ipconfig getifaddr en0`).

---

## 필요한 포트 매핑 4줄

| 서비스 | 외부 포트 | 프로토콜 | 내부 IP | 내부 포트 | 비고 |
|--------|----------|---------|---------|-----------|------|
| main-site (Vite) | 5173 | TCP | 172.30.1.81 | 5173 | 요청자/공급자 앱 |
| admin-site (Vite) | 5174 | TCP | 172.30.1.81 | 5174 | 관리자 앱 |
| api-server | **18080** | TCP | 172.30.1.81 | 8080 | ISP 가 외부 8080 을 차단하므로 18080 으로 우회 |
| admin-server | 8081 | TCP | 172.30.1.81 | 8081 | — |

결과적으로 외부 접속 URL:

- `http://121.133.86.173:5173` (메인)
- `http://121.133.86.173:5174` (어드민)
- `http://121.133.86.173:18080/swagger-ui.html` (api swagger)
- `http://121.133.86.173:8081/swagger-ui.html` (admin swagger)

---

## 단계별 설정

### 1. 공유기 관리자 로그인

1. 브라우저에서 `http://172.30.1.254` 접속
2. 관리자 계정으로 로그인 (ID/PW 는 공유기 뒷면 스티커나 기록 참고)

### 2. 포트 포워딩 메뉴 진입

제조사별 메뉴 이름이 다르다:

| 제조사 | 메뉴 경로 예시 |
|--------|---------------|
| iptime | 고급설정 → NAT/라우터 관리 → 포트포워드 설정 |
| ASUS | WAN → 가상서버 / 포트 포워딩 |
| KT 올레기가 | 장치설정 → 트래픽 관리 → 포트포워딩 |
| TP-Link | 고급 → NAT 포워딩 → 가상 서버 |
| 공유기 모름 | `http://172.30.1.254` 에서 "포트 포워딩" / "가상 서버" / "NAT" 검색 |

### 3. 규칙 4개 추가

위 표의 4줄을 각각 추가. 대부분의 UI 는 다음 필드를 묻는다:

- **규칙 이름** (임의): fsm-main, fsm-admin-site, fsm-api, fsm-admin-api
- **외부 포트** (시작~끝 같은 포트): 5173 / 5174 / 18080 / 8081
- **내부 IP**: `172.30.1.81`
- **내부 포트**: 5173 / 5174 / 8080 / 8081 (api 서버만 외부 18080 → 내부 8080)
- **프로토콜**: TCP

설정 후 "적용" / "저장" 버튼. 공유기 재부팅 요구 시 1~2분 대기.

### 4. Mac IP 고정 (DHCP 예약)

LAN IP 가 바뀌면 포워딩이 엉킨다. 공유기의 **DHCP 예약** (또는 "고정 IP", "IP 예약") 메뉴에서 Mac 을 고정:

1. Mac 의 MAC 주소 확인: `ifconfig en0 | grep ether` (예: `a4:83:e7:xx:xx:xx`)
2. 공유기 DHCP 예약 메뉴에서 해당 MAC ↔ `172.30.1.81` 바인딩
3. 저장

### 5. 확인

Mac 터미널에서:

```bash
curl -m 8 -s -o /dev/null -w "HTTP %{http_code}\n" http://121.133.86.173:5173/
curl -m 8 -s -o /dev/null -w "HTTP %{http_code}\n" http://121.133.86.173:5174/
curl -m 8 -s -o /dev/null -w "HTTP %{http_code}\n" http://121.133.86.173:18080/actuator/health
curl -m 8 -s -o /dev/null -w "HTTP %{http_code}\n" http://121.133.86.173:8081/actuator/health
```

전부 `HTTP 200` 이면 성공.

**같은 WiFi 안에서 공인 IP 로 쏘는 건 hairpin NAT 미지원 공유기에선 실패한다.** 반드시 외부 네트워크 (LTE 연결 폰 등) 에서 한 번 더 검증할 것.

---

## ISP 가 8080 을 막는 이유

한국 ISP (KT / LGU+ / SKT) 는 가정용 회선에서 **외부 포트 80, 8080, 443** 등 well-known 포트를 기본 차단하는 경우가 많다. 공유기 포워딩을 올바르게 걸어도 외부→공유기 단계에서 막히는 현상. 해결책은 외부 포트를 bypass 용 숫자로 쓰는 것 (이 프로젝트는 api-server 를 `18080` 으로 노출). admin-server 의 `8081` 은 위 대역에 포함되지 않아 그대로 허용된다.

---

## 임시로 UPnP 쓸 때

영구 설정을 잠깐 미루고 지금 당장 열어야 할 때:

```bash
brew install miniupnpc  # 미설치 시 (이미 설치돼 있음)
upnpc -a 172.30.1.81 5173 5173 TCP 0
upnpc -a 172.30.1.81 5174 5174 TCP 0
upnpc -a 172.30.1.81 8081 8081 TCP 0
upnpc -a 172.30.1.81 8080 18080 TCP 0   # 내부 8080 → 외부 18080
upnpc -l    # 확인
```

공유기/Mac 재부팅 시 매핑 초기화 → 다시 4줄 실행.

---

## Vite 바인딩 (이미 영구 설정됨)

Vite 는 기본적으로 `localhost` 에만 바인딩하므로 외부 장비에서 접근 불가. `frontend/apps/*/package.json` 의 `dev` 스크립트에 `--host` 가 추가되어 있어 모든 인터페이스 바인딩된다 (commit `6b5e6c1`). 이 부분은 코드 레벨로 고정되어 재설정 불필요.

## CORS (이미 영구 설정됨)

`fsm.cors.allowed-origin-patterns` 의 기본값이 `http://*:5173,http://*:5174` 이라 공인 IP / LAN IP / 다른 호스트 어디서 와도 CORS OK. 별도 설정 필요 없음.

## macOS 방화벽

`System Settings → Network → Firewall` 이 **Off** 여야 한다 (현재 Off 확인됨). On 이면 Java / Node 프로세스에 대해 "Allow incoming connections" 허용 필요.

---

## 트러블슈팅 체크리스트

| 증상 | 진단 | 조치 |
|------|------|------|
| 외부 접속 전부 타임아웃 | 공유기 포워딩 규칙 유무 | 위 4줄 재확인 |
| 외부 접속 refused / reset | Mac 내부 서비스 다운 | `lsof -i :5173 -i :5174 -i :8080 -i :8081 -sTCP:LISTEN` 로 LISTENING 확인 |
| 외부 8080 만 안 됨 | ISP 차단 | `18080` 으로 우회 (위 표 참고) |
| LAN (`172.30.1.81:*`) 은 되는데 공인 IP 는 안 됨 | 포워딩 부재 또는 DHCP IP 변경 | 포워딩 내부 IP 가 현재 Mac IP 와 일치하는지 확인 |
| 같은 WiFi 에서만 공인 IP 접속 실패 | hairpin NAT 미지원 | 외부 네트워크 (폰 LTE) 에서 검증 |
| Mac 에서 현재 공인 IP 확인 | — | `curl -s -4 ifconfig.me` 또는 `upnpc -s \| grep ExternalIPAddress` |
| 매핑 현황 확인 | — | 공유기 관리자 페이지의 포워딩 테이블, 또는 `upnpc -l` (UPnP 매핑만 보임) |

---

## 참고

- `.sisyphus/session-handoff-2026-04-20.md` — 이 PC 부트스트랩 히스토리
- `memories/09-infrastructure-ops.md` — 로컬 기동 / 포트 매핑 기록 (local-only)
- `memories/01-identity-and-environment.md` — 공인 IP / 공유기 주소 기록 (local-only)

이 가이드대로 설정하면 이후 공유기 재부팅이나 Mac 재기동에도 외부 접속이 유지된다. 매핑 4줄 + DHCP 예약 1건 만 걸어 두면 끝.
