# 빌드/배포 체크리스트 (꼭 단계별로 보면서 진행하세요)

> 이 문서는 **나중에 빌드할 때 잊지 말아야 할 모든 것** 입니다.
> Lovable 샌드박스에서는 실제 iOS/Android 빌드를 못 하기 때문에,
> 여기 적힌 순서대로 본인 PC(또는 EAS 클라우드 빌드)에서 진행하셔야 합니다.

---

## 0. 핵심 원칙 (절대 잊지 마세요)

1. **앱 안에서는 콘텐츠 열람만** — 결제/구독 UI 를 앱에 절대 넣지 않습니다.
2. **결제는 외부 브라우저(Paddle)** 로만 — Apple "Reader App" 정책 준수.
3. **모든 AI 추론은 온디바이스** — 카메라 프레임을 서버로 보내지 않습니다.
4. **루팅/탈옥 기기 차단** — 보안 우선.
5. **백그라운드 전환 시 콘텐츠 자동 가림** (앱 스위처 캡처 방지).
6. **스크린 캡처/녹화 전역 차단** (`expo-screen-capture`).
7. **결제 URL(`/checkout`, `paddle.com`) 은 WebView 안에서 안 열림** → 외부 브라우저로 강제 이동.

---

## 1. 빌드 전에 반드시 채워야 할 변수들

### 1-1. `apps/mobile/app.json` 의 `extra` 블록

```json
"extra": {
  "WEB_BASE_URL": "https://your-web-domain.com",   // ← 실제 웹 도메인
  "SUPABASE_URL": "REPLACE_AT_BUILD",              // ← Lovable Cloud 의 Supabase URL
  "SUPABASE_ANON_KEY": "REPLACE_AT_BUILD"          // ← anon (publishable) key
}
```

| 키 | 어디서 찾나요 | 비고 |
|---|---|---|
| `WEB_BASE_URL` | Lovable 에서 `Publish` 후 받은 도메인 또는 커스텀 도메인 | `https://` 포함, 마지막 `/` 없음 |
| `SUPABASE_URL` | 웹 프로젝트의 `.env` 에 있는 `VITE_SUPABASE_URL` 값 | 동일 |
| `SUPABASE_ANON_KEY` | 웹 프로젝트의 `.env` 에 있는 `VITE_SUPABASE_PUBLISHABLE_KEY` 값 | publishable/anon 키 (service key 절대 X) |

> ⚠️ **service_role 키는 절대 모바일 앱에 넣지 마세요.** anon key 만 사용합니다.

### 1-2. Bundle Identifier / Package Name 확정

- iOS: `com.providencetheology.proweb` (변경 시 Apple Developer 의 App ID 와 동일하게)
- Android: `com.providencetheology.proweb` (Play Console 등록 패키지명과 동일하게)

이 값은 **한 번 스토어에 올리면 변경 불가** 입니다.

---

## 2. 모델 파일 추가 (카메라 감지에 필수)

```
apps/mobile/assets/models/yolov8n.tflite
```

이 파일이 **없으면 앱이 빌드는 되어도 카메라 감지가 동작하지 않습니다.**

### 받는 방법

```bash
# Python 환경에서
pip install ultralytics
yolo export model=yolov8n.pt format=tflite imgsz=320 int8=False
# 결과: yolov8n_saved_model/yolov8n_float32.tflite
# 이 파일을 yolov8n.tflite 로 이름 바꿔서 apps/mobile/assets/models/ 에 복사
```

또는 Ultralytics 가 호스팅하는 사전 export 파일을 다운로드하셔도 됩니다.

> 모델 라이선스: YOLOv8 = AGPL-3.0. 상용 배포 시 Ultralytics 상용 라이선스 별도 구매 필요.
> AGPL 이 부담스러우시면 추후 자체 학습 모델(MIT/Apache) 로 교체 권장.

---

## 3. 결제 시스템 — Paddle 설정

> 결제는 **웹** 에서만 처리합니다. 앱은 외부 브라우저로 결제 페이지를 열기만 합니다.

### Sandbox (테스트)
- 도메인 없이 가능. Lovable preview URL 그대로 사용.
- `paddle_client_token` (test_*) 사용.

### Live (실서비스)
- **커스텀 도메인 필수** — Paddle 승인 조건.
- 다음을 모두 준비:
  - 사업자 정보, 결제 정책/환불 정책 페이지
  - 커스텀 도메인 (e.g. `providence-theology.com`)
  - 웹훅 엔드포인트: `/api/public/paddle-webhook` (서명 검증 필수)
- Paddle Live 승인 후 `paddle_client_token` (live_*) 로 교체.

### 모바일 앱과의 연동
- 앱 홈의 "구독하기 (브라우저)" → `WEB_BASE_URL/pricing?from=app` 을 외부 브라우저로 오픈
- 결제 완료 → 웹훅 → Supabase `subscriptions` 테이블 갱신
- 앱이 다시 열리면 `useSubscription()` 훅이 최신 상태 읽어옴

---

## 4. 인증 (Supabase Auth)

앱과 웹이 **같은 Supabase 프로젝트** 를 쓰기 때문에 로그인은 한 번만 하면 됩니다.

권장: 앱 첫 진입 시 외부 브라우저로 웹 로그인 → 딥링크(`proweb://auth-callback`) 로 토큰 전달.
이 부분은 v0.2 에서 추가합니다(현재 v0.1 은 콘텐츠 열람 + 감지 위주).

---

## 5. 실제 빌드 명령 (3가지 방법 중 택1)

### 방법 A: EAS Cloud Build (Mac 없어도 됨, 추천)

```bash
cd apps/mobile
npm install -g eas-cli
eas login                          # Expo 계정 로그인
eas build:configure                # eas.json 자동 인식
eas build --platform ios           # iOS 빌드 (Apple Developer 계정 연동 필요)
eas build --platform android       # Android APK/AAB 빌드
```

필요한 계정:
- **Expo 계정** (무료) — `eas` CLI 로그인
- **Apple Developer Program** — $99/년 (iOS 빌드/배포 필수)
- **Google Play Console** — $25 (1회) (Android 배포 시)

### 방법 B: 로컬 빌드 (Mac + Xcode 필요)

```bash
cd apps/mobile
npx expo prebuild                  # ios/ android/ 폴더 생성
npx expo run:ios                   # 시뮬레이터 실행
npx expo run:android               # 에뮬레이터 실행
```

### 방법 C: 데스크탑 (Windows/Mac) 앱 — 이미 만들어진 Electron 사용

`electron/main.cjs` 가 이미 `setContentProtection(true)` 로 캡처 차단됨.

```bash
npm run electron:build
```

---

## 6. 스토어 제출 시 주의사항

### iOS App Store
- "Reader App" 으로 등록 (Apple 가이드라인 3.1.3 (a))
- 앱 설명에 **"외부 웹사이트에서 결제"** 명시
- `NSCameraUsageDescription` 사유: "주변 촬영 기기 감지를 위해 카메라 권한이 필요합니다"
- 콘텐츠가 종교/학술이면 Age Rating: 4+ 가능

### Google Play
- Play Billing 우회 정책 — Reader 카테고리로 신청 시 외부 결제 허용 (2024 정책 확인)
- 또는 한국의 경우 "전기통신사업법 개정안" 에 따른 외부 결제 사용 가능

---

## 7. 빌드 시 자주 발생하는 에러

| 증상 | 원인 | 해결 |
|---|---|---|
| `Unable to resolve "yolov8n.tflite"` | 모델 파일 없음 | 섹션 2 진행 |
| `Camera permission denied` | iOS Info.plist 누락 | `app.json` 의 `NSCameraUsageDescription` 확인 |
| `JailMonkey not found` | autolinking 미적용 | `npx expo prebuild --clean` 후 재빌드 |
| `frameProcessor is null` | worklets 미설치 | `babel.config.js` 에 `react-native-reanimated/plugin` 마지막에 추가됐는지 확인 |
| TFLite GPU delegate 에러 | 일부 안드로이드 기기 호환성 | `useTensorflowModel(..., { delegate: 'default' })` 로 fallback |
| 화면이 까맣게만 나옴 | 카메라 mount 가 늦음 | `modelLoaded && hasPermission` 확인 |
| WebView 안에서 결제 페이지가 열림 | URL 패턴 누락 | `library.tsx` 의 `onShouldStartLoadWithRequest` 조건 확인 |

---

## 8. v0.1 에서 의도적으로 빠진 것 (다음 단계 작업)

- [ ] 웹 ↔ 앱 SSO 딥링크 (`proweb://auth-callback`)
- [ ] 오프라인 다운로드 (DRM 적용된 epub)
- [ ] Push notification (`expo-notifications` 설정만 되어 있음)
- [ ] 자체 학습 카메라 감지 모델 (AGPL 회피)
- [ ] watermark 동적 워터마크(사용자 ID 반투명 오버레이)

---

## 9. Lovable 샌드박스에서 절대 못 하는 것 (꼭 기억)

- iOS/Android 시뮬레이터 실행
- `.tflite` / Swift / Kotlin 네이티브 코드 빌드
- App Store / Play Store 업로드
- Xcode signing

→ 위 작업은 모두 본인 PC + EAS 클라우드 빌드로 진행하셔야 합니다.
이 문서를 빌드 PC 에서도 그대로 보면서 따라 하시면 됩니다.
