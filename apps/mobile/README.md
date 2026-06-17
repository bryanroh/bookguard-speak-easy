# ProWeb Mobile (iOS / Android)

섭리신학연구소 웹북의 네이티브 모바일 앱입니다.

## 절대 원칙 (변경 금지)

1. **앱은 콘텐츠 열람만 합니다.** 결제 UI/로직 0줄.
2. **결제는 외부 브라우저에서.** `expo-web-browser`로 Paddle 결제 페이지를 엽니다. (Apple Reader App 정책)
3. **로그인은 웹과 공유** — Supabase Auth.
4. **화면 캡처 차단** — `expo-screen-capture` 전역 적용.
5. **루팅/탈옥 차단** — `jail-monkey`.
6. **AI 카메라 감지** — 전면 카메라 + 온디바이스 ML.
7. **외부 서버로 카메라 영상 전송 금지.**

## 개발 환경

- Expo SDK 52 (bare workflow 가능)
- React Native 0.76 (New Architecture)
- TypeScript strict

## 빌드 방법

### A. 본인 Mac/PC에서 빌드

```bash
cd apps/mobile
npm install
npx expo prebuild          # ios/ android/ 폴더 생성
npx expo run:ios           # Mac + Xcode 필요
npx expo run:android       # Android Studio 필요
```

### B. 클라우드 빌드 (Mac 없이 가능 - 권장)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios       # iOS 빌드 (Apple 개발자 계정 필요)
eas build --platform android   # Android 빌드

# 스토어 자동 업로드
eas submit --platform ios
eas submit --platform android
```

## 폴더 구조

```
apps/mobile/
├── app/                   # expo-router 화면
│   ├── _layout.tsx        # 전역 캡처 차단 + Provider
│   ├── index.tsx          # 홈 (구독 버튼 → 외부 브라우저)
│   └── library.tsx        # 웹북 뷰어 (WebView)
├── src/
│   ├── lib/
│   │   ├── supabase.ts          # 인증 (웹과 세션 공유)
│   │   └── cameraDetection.ts   # AI 카메라 감지 (TODO)
│   ├── components/
│   ├── hooks/
│   └── navigation/
├── assets/
│   └── models/            # TFLite 모델 (빌드 시 추가)
├── app.json               # Expo 설정 + 권한
├── eas.json               # EAS 빌드 설정
└── package.json
```

## 빌드 전 필수 체크리스트

**👉 `BUILD_NOTES.md` 를 빌드 PC 에서 그대로 보면서 따라 하세요.**
변수 설정, 모델 파일, Paddle Live 승인, 스토어 제출까지 전부 적혀 있습니다.

요약:
- [ ] `app.json` 의 `extra.WEB_BASE_URL` / `SUPABASE_URL` / `SUPABASE_ANON_KEY` 채우기
- [ ] `assets/models/yolov8n.tflite` 모델 파일 추가
- [ ] Apple Developer ($99/년) + Google Play ($25) 계정 등록
- [ ] Paddle Live 승인 (커스텀 도메인 필수)
- [ ] EAS 빌드 → 스토어 제출
