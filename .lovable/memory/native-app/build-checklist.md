---
name: 모바일 앱 빌드 변수
description: apps/mobile 빌드 시 반드시 채워야 할 변수 및 모델 파일 목록
type: feature
---

빌드 시 사용자에게 반드시 안내해야 하는 항목 (apps/mobile/BUILD_NOTES.md 와 동기화):

1. `apps/mobile/app.json` → extra.WEB_BASE_URL / SUPABASE_URL / SUPABASE_ANON_KEY
2. `apps/mobile/assets/models/yolov8n.tflite` 모델 파일 (Ultralytics export, AGPL 주의)
3. Bundle ID: com.providencetheology.proweb (한 번 정하면 변경 불가)
4. Paddle Live 는 커스텀 도메인 필수
5. EAS 빌드 또는 Mac+Xcode 필요. Lovable 샌드박스에선 빌드 불가.
6. Apple Developer $99/년, Google Play $25 일회성 필요.
7. 결제 URL(/checkout, /pricing, paddle.com) 은 WebView 에서 외부 브라우저로 강제.
8. babel.config.js: worklets-core/plugin 이 reanimated/plugin 보다 먼저 와야 함.
9. metro.config.js: assetExts 에 tflite 포함 필수.
