## 보안 강화 6종 일괄 구현 계획

선택해주신 모든 항목을 한 번에 처리합니다. 작업이 크므로 단계별로 명확히 나눠 설명드립니다.

---

### 1️⃣ 카메라 없는 기기 차단 (1-a)

**동작:**
- 앱 진입 시 `navigator.mediaDevices.enumerateDevices()`로 카메라 존재 여부 먼저 확인
- 카메라 없음 → 전용 차단 페이지 표시: "본 서비스는 카메라가 있는 기기에서만 이용 가능합니다. USB 웹캠을 연결하거나 노트북/모바일로 접속해 주세요."
- 카메라 있음 + 권한 거부 → 기존 동작 유지 (보호 비활성 배지)
- 카메라 있음 + 권한 허용 → 정상 작동

**구현 위치:** `src/hooks/use-camera-detection.ts` 상단에 device enumeration 추가, 리더 페이지(`read.$pageId.tsx`)에 차단 UI 추가.

---

### 2️⃣ 본문 Canvas 렌더링 + TTS 유지 (2-b)

**핵심 요구:** TTS는 무조건 작동해야 함.

**해법 (하이브리드):**
- **시각 출력**: HTML → Canvas로 렌더링 (텍스트가 픽셀이 됨 → F12로 본문 텍스트 추출 불가)
- **TTS 입력**: 원본 HTML 텍스트는 메모리에만 유지, DOM에는 노출 안 함 → TTS 엔진에 직접 전달
- 사용자는 시각적으로는 동일하게 보지만, DevTools에서는 `<canvas>` 태그만 보임
- 사용자가 "현재 페이지 TTS 재생" 버튼 누르면 평소처럼 작동

**구현:**
- 새 컴포넌트 `src/components/CanvasReader.tsx`: HTML 문자열 받아 canvas에 렌더링
- 기존 `TTSControls`는 그대로 사용 (이미 html prop 받음)
- `read.$pageId.tsx`에서 `dangerouslySetInnerHTML` → `<CanvasReader html={...} />` 교체
- 워터마크는 canvas 위에 그대로 오버레이

**트레이드오프 안내:**
- 텍스트 선택/복사 자체가 불가능해짐 (이미 차단되어 있어 영향 없음)
- 줌/리사이즈 시 재렌더링 필요 (해상도 대응)
- 글꼴 렌더링 품질은 브라우저 기본 텍스트보다 약간 차이 있을 수 있음 → high-DPI 보정으로 최소화

---

### 3️⃣ 1계정 1세션 강제 (3-C-1)

**동작:**
- 로그인 성공 시 새로운 `session_token` 발급 후 DB(`active_sessions` 테이블)에 저장
- 다른 기기에서 새 로그인 → 기존 세션 토큰 무효화
- 기존 기기에서 액션 시 → "다른 기기에서 로그인되어 자동 로그아웃됩니다" → 강제 로그아웃

**구현:**
- 신규 테이블 `active_sessions` (user_id, session_token, device_fingerprint, ip, last_seen)
- 신규 서버 함수 `register-session.functions.ts` (로그인 직후 호출)
- 신규 서버 함수 `verify-session.functions.ts` (15초마다 폴링)
- 폴링 클라이언트 훅 `use-session-guard.ts` → `__root.tsx`에 마운트

---

### 4️⃣ IP 로그 기록 (4-D-3)

**동작:**
- 차단 없이 단순 기록만 (가장 안전)
- 로그인/세션 등록/캡처 이벤트 시 서버에서 IP 자동 기록
- 운영자가 관리자 페이지에서 이상 패턴 확인 가능

**구현:**
- `active_sessions.ip` 컬럼 활용
- 신규 테이블 `ip_log` (user_id, ip, country, user_agent, action, created_at)
- 관리자 페이지 `admin.users.tsx`에 사용자별 IP 이력 보기 추가

---

### 5️⃣ 법적 약관 추가 (5)

**문구 (이미 합의된 내용):**
- 무단 화면 캡처 금지 (스크린샷, 화면 녹화 포함)
- 인쇄/PDF 추출 금지
- 계정 공유 금지 (1계정 1인 사용)
- 자동화 도구 사용 금지 (봇, 크롤러, 스크래핑)
- 위반 시 즉시 계정 정지 및 **징벌적 손해배상** 청구 가능
- 손해배상액: 콘텐츠 정가의 최소 100배 또는 1천만원 중 큰 금액

**구현:** `src/routes/terms.tsx`에 "제8조 보안 및 무단 사용 금지" 섹션 추가.

---

### 6️⃣ 디바이스 핑거프린팅 (6-J-3)

**동작:**
- 브라우저 핑거프린트(User-Agent + 화면해상도 + 언어 + 타임존 + Canvas 핑거프린트) 생성
- 세션 등록 시 핑거프린트 저장
- 매 요청 시 핑거프린트 검증 → 불일치 시 강제 로그아웃
- 링크를 다른 디바이스에 공유해도 즉시 무력화

**구현:**
- `src/lib/device-fingerprint.ts` 신규 (외부 라이브러리 없이 자체 구현)
- `active_sessions.device_fingerprint`에 저장
- `verify-session` 서버 함수에서 fingerprint 일치 여부 함께 검증

---

### 📋 데이터베이스 마이그레이션

```sql
-- active_sessions: 1계정 1세션 + 핑거프린트
CREATE TABLE public.active_sessions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  device_fingerprint text NOT NULL,
  ip text,
  user_agent text,
  last_seen timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ip_log: 접속 IP 이력 (관리자 분석용)
CREATE TABLE public.ip_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ip text NOT NULL,
  user_agent text,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

RLS 적용: 본인 데이터만 조회 가능, 관리자는 전체 조회.

---

### 🎯 작업 순서

1. DB 마이그레이션 (active_sessions, ip_log)
2. 서버 함수 3종 (register-session, verify-session, log-ip)
3. 디바이스 핑거프린트 라이브러리
4. 세션 가드 훅 + __root.tsx 마운트
5. 카메라 사전 검사 (use-camera-detection.ts 수정)
6. CanvasReader 컴포넌트 + 리더 페이지 교체
7. 약관 추가 (terms.tsx)
8. 로그인 페이지에 세션 등록 통합

---

### ⚠️ 사전 안내

- **Canvas 렌더링**은 이미지/표가 많은 책에서는 폴백(기존 HTML)이 필요할 수 있어, 일단 텍스트 위주 페이지에 적용하고 문제 발생 시 책별 토글 추가 검토.
- **1계정 1세션**은 사용자가 PC→모바일 이동 시 매번 재로그인 필요. 이는 의도된 동작입니다.
- **핑거프린트**는 브라우저 업데이트나 시크릿 모드 변경 시 바뀔 수 있어, 본인도 가끔 재로그인하는 케이스 발생 가능.

승인해 주시면 바로 진행하겠습니다.