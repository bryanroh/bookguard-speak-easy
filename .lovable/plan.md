# 네이티브 앱 구현 계획 (모바일 + 데스크톱)

## 🔒 절대 원칙 (반드시 유지)

1. **앱 안에서는 콘텐츠 열람만** — 결제 UI/결제 처리 코드 앱에 절대 넣지 않음
2. **구독/결제는 외부 브라우저(Safari/Chrome)에서 처리** — Apple Reader App 정책 준수
3. **기존 Paddle 웹 결제 시스템 그대로 유지** — 변경 없음
4. **로그인은 앱과 웹 공유** (Supabase Auth 세션) — 한 번 결제하면 앱에서 자동 인식

---

## 📦 최종 구성

| 플랫폼 | 기술 | 역할 |
|---|---|---|
| **iOS / Android** | React Native (Expo bare workflow) + 네이티브 모듈 | 콘텐츠 열람 + 강력한 캡처 차단 |
| **Windows / macOS / Linux** | 기존 Electron 유지 (`electron/main.cjs`) | 데스크톱 열람 + `setContentProtection` |
| **웹 (모든 결제, 관리자)** | 기존 TanStack Start + Paddle 그대로 | 가입 / 결제 / 구독 관리 / 관리자 |

---

## 🗺️ 단계별 진행 계획

### **0단계: 사전 정리 (현재 세션)**
- 이 계획서 승인
- `mem://` 에 핵심 원칙 영구 저장 (다음 세션에서도 잊지 않도록)
- 모노레포 구조 결정: `apps/web` (현재), `apps/mobile` (신규), `apps/desktop` (electron 이동)

### **1단계: 결제 분리 검증 (웹만 작업)**
- 현재 웹의 결제 페이지를 **모바일 친화 외부 페이지**로 정비
  - 모바일 브라우저에서 열렸을 때 깔끔하게 보이도록 반응형 점검
  - 결제 완료 → `proweb://payment-success?token=...` 같은 **딥링크로 앱 복귀** 처리
- Supabase Auth 세션 토큰을 딥링크로 안전하게 전달하는 방식 설계
- 산출물: `payment/start`, `payment/success`, `payment/cancel` 페이지

### **2단계: React Native 프로젝트 생성**
- `apps/mobile/` 에 Expo bare workflow로 생성 (네이티브 모듈을 자유롭게 쓰기 위해)
- 공유 코드(타입, Supabase 클라이언트, i18n) → `packages/shared`
- iOS/Android 양쪽 빌드 환경 구축
- 산출물: 빈 셸 앱이 빌드되고 시뮬레이터에서 실행됨

### **3단계: 로그인 & 콘텐츠 열람 기본 구현**
- Supabase Auth (이메일 + Google) 동일 적용 → 웹과 세션 호환
- 도서 목록 / 도서 상세 / 페이지 리더 화면 3개
- 콘텐츠는 React Native WebView로 렌더링 (보안 옵션 최대)
- 산출물: 앱에서 로그인 후 콘텐츠를 읽을 수 있음

### **4단계: 외부 브라우저 결제 플로우 연결** ⭐ 핵심
- 앱 내 "구독하기" 버튼 → `expo-web-browser` 또는 `SFSafariViewController` / `Custom Tabs`로 결제 페이지 오픈
- 결제 완료 → 딥링크(`proweb://`)로 앱 자동 복귀
- 앱이 Supabase에서 구독 상태 재조회 → 콘텐츠 잠금 해제
- **앱 내부에는 결제 코드/Paddle SDK 0줄** — Apple 심사 통과의 핵심
- 산출물: 앱에서 시작 → 외부 결제 → 앱 복귀 → 구독 활성화 완료

### **5단계: OS 레벨 캡처 차단 (네이티브 모듈)**
- **Android**: `FLAG_SECURE` 적용 → 스크린샷·녹화 완전 차단 (커널 레벨)
- **iOS**:
  - `UIScreen.isCaptured` 감지 → 화면 검정 처리
  - `UIScreen.capturedDidChangeNotification` 녹화 감지
  - 스크린샷 시 `UIApplicationUserDidTakeScreenshotNotification` → 경고 + 로그
- **외부 디스플레이/미러링 감지**: AirPlay/HDMI 연결 시 콘텐츠 숨김
- 산출물: 스크린샷·녹화 시도 시 OS 레벨에서 차단됨

### **6단계: AI 카메라 감지 (외부 촬영 차단)**
- iOS: **Vision Framework** (네이티브 Swift)
- Android: **ML Kit Object Detection** (네이티브 Kotlin)
- 감지 대상: 휴대폰, 카메라, DSLR, 태블릿
- 전면 카메라로 0.5초마다 1프레임 분석 → 의심 시 화면 블러 + 로그아웃
- 산출물: 다른 폰으로 화면 촬영 시 즉시 차단

### **7단계: 렌즈 글린트 감지 (고급)**
- OpenCV iOS/Android → HoughCircles로 렌즈 원형 반사 감지
- 안경/시계 오탐 최소화 위해 6단계 AI와 교차 검증
- 산출물: 렌즈 자체를 감지 (감추기 어려움)

### **8단계: 추가 보안**
- 루팅/탈옥 감지 (iOS: `DTTJailbreakDetection` / Android: `Play Integrity API`) → 차단
- 디바이스 핑거프린트 (기존 웹 시스템과 통합) — 한 계정 한 기기 강제
- 워터마크 (이메일 + 시간) WebView 오버레이

### **9단계: 데스크톱 (Electron) 보안 강화**
- 이미 존재하는 `electron/main.cjs` 에:
  - `win.setContentProtection(true)` → Windows/Mac 스크린샷 차단
  - 외부 디스플레이 감지 → 콘텐츠 숨김
- 산출물: Windows 11 / macOS에서 캡처 차단되는 데스크톱 앱

### **10단계: 스토어 출시**
- Apple App Store: Reader App 신고 (`com.apple.developer.storekit.external-purchase` 불필요, 단순히 결제 UI 없음)
- Google Play Store: 일반 출시 (외부 결제도 2024년 이후 허용)
- Microsoft Store: Electron 앱 등록 (선택)

---

## 🛠 기술 세부 (개발자용)

- **React Native 0.75+ / Expo SDK 52** (bare workflow — `expo prebuild`로 ios/android 폴더 노출)
- **상태/통신**: TanStack Query (웹과 동일 패턴 재사용)
- **딥링크**: `proweb://` 스킴 + Universal Links (iOS) / App Links (Android)
- **모노레포**: bun workspaces, `packages/shared` 에 Supabase 클라이언트·타입·i18n 공유
- **CI**: EAS Build (Expo Application Services)로 클라우드 빌드 → TestFlight / Internal Testing 자동 배포

---

## ⏱ 예상 일정

| 단계 | 작업량 |
|---|---|
| 0–1 (정리·결제 분리) | 1~2일 |
| 2–4 (앱 셸 + 로그인 + 외부결제) | 1주 |
| 5 (OS 캡처 차단) | 3일 |
| 6–7 (AI + 렌즈 감지) | 1~2주 |
| 8–9 (추가 보안 + Electron) | 3일 |
| 10 (스토어 등록 심사) | 1~2주 (Apple 심사 대기 포함) |

**전체: 약 5~7주**

---

## ▶️ 지금 시작할 작업 (승인 후)

1. 핵심 원칙을 `mem://` 에 저장 (잊지 않도록)
2. **1단계** 진행: 웹 결제 페이지를 모바일 브라우저에서도 깔끔히 보이도록 정비 + 딥링크 복귀 메커니즘 추가
3. 동시에 모노레포 구조로 폴더 재배치 준비

**승인해주시면 0–1단계부터 즉시 진행하겠습니다.** 단계마다 결과를 보여드리고 다음으로 넘어갈지 확인받겠습니다.
