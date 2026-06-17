import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert, AppState } from 'react-native';
import { WebView } from 'react-native-webview';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as ScreenCapture from 'expo-screen-capture';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import JailMonkey from 'jail-monkey';
import { useCameraDetector, DetectionResult } from '../src/lib/cameraDetection';

const WEB_BASE_URL =
  (Constants.expoConfig?.extra?.WEB_BASE_URL as string) ?? 'https://example.com';

// 연속 감지 N 프레임 이상이면 차단 (1 회성 false-positive 무시)
const BLOCK_THRESHOLD_FRAMES = 6;
// 마지막 감지 후 이 시간(ms) 지나면 자동 해제
const AUTO_CLEAR_MS = 4000;

export default function Library() {
  const [blocked, setBlocked] = useState<null | 'jailbreak' | 'camera' | 'background'>(null);
  const [lastDetection, setLastDetection] = useState<DetectionResult | null>(null);
  const consecutiveRef = useRef(0);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');

  const onDetect = (r: DetectionResult) => {
    if (r.cameraDetected || r.lensGlintDetected) {
      consecutiveRef.current += 1;
      setLastDetection(r);
      if (consecutiveRef.current >= BLOCK_THRESHOLD_FRAMES) {
        setBlocked('camera');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => {
        consecutiveRef.current = 0;
        setLastDetection(null);
        setBlocked((b) => (b === 'camera' ? null : b));
      }, AUTO_CLEAR_MS);
    } else {
      consecutiveRef.current = Math.max(0, consecutiveRef.current - 1);
    }
  };

  const { frameProcessor, modelLoaded, modelError } = useCameraDetector(onDetect);

  // 1) 루팅/탈옥 차단
  useEffect(() => {
    if (JailMonkey.isJailBroken()) {
      setBlocked('jailbreak');
      Alert.alert('보안 경고', '루팅/탈옥된 기기에서는 콘텐츠를 열람할 수 없습니다.');
    }
  }, []);

  // 2) 카메라 권한
  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  // 3) 스크린샷 감지 (경고만)
  useEffect(() => {
    const sub = ScreenCapture.addScreenshotListener(() => {
      Alert.alert('알림', '스크린샷이 감지되었습니다. 본 콘텐츠는 저작권 보호 대상입니다.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    });
    return () => sub.remove();
  }, []);

  // 4) 백그라운드 -> 포그라운드 복귀 시 가림
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') setBlocked('background');
      else if (s === 'active') setBlocked((b) => (b === 'background' ? null : b));
    });
    return () => sub.remove();
  }, []);

  // 5) 모델 로드 에러
  useEffect(() => {
    if (modelError) {
      console.warn('[cameraDetection] model load failed:', modelError);
    }
  }, [modelError]);

  if (blocked === 'jailbreak') {
    return (
      <View style={styles.center}>
        <Text style={styles.warn}>이 기기에서는 콘텐츠를 열람할 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      {/* 숨겨진 전면 카메라 - 프레임 감지 전용 (화면에 보이지 않음) */}
      {hasPermission && device && modelLoaded && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={!blocked}
          frameProcessor={frameProcessor}
          pixelFormat="yuv"
          // 미리보기는 보이지 않게 1x1 로 클리핑
          // (Vision Camera 는 mount 가 되어야 frameProcessor 가 동작)
        />
      )}

      <WebView
        source={{ uri: `${WEB_BASE_URL}/library?from=app` }}
        style={{ flex: 1, backgroundColor: '#0F172A' }}
        // 결제 URL 은 절대 WebView 내부에서 열지 않음 (Apple Reader 정책)
        onShouldStartLoadWithRequest={(req) => {
          const isCheckout =
            req.url.includes('/checkout') ||
            req.url.includes('/pricing') ||
            req.url.includes('paddle.com') ||
            req.url.includes('checkout.paddle.com');
          if (isCheckout) {
            WebBrowser.openBrowserAsync(req.url);
            return false;
          }
          return true;
        }}
      />

      {/* 차단 오버레이 */}
      {blocked && (
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.center}>
            <Text style={styles.blockTitle}>
              {blocked === 'camera' ? '촬영 기기가 감지되었습니다' : '콘텐츠 보호 모드'}
            </Text>
            <Text style={styles.blockSub}>
              {blocked === 'camera'
                ? `주변에서 카메라/스마트폰이 감지되어 콘텐츠를 일시 차단했습니다.\n감지가 멈추면 자동으로 해제됩니다.`
                : '앱이 백그라운드로 전환되어 콘텐츠를 가렸습니다.'}
            </Text>
            {lastDetection && blocked === 'camera' && (
              <Text style={styles.meta}>
                confidence: {(lastDetection.confidence * 100).toFixed(0)}%
              </Text>
            )}
          </View>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  warn: { color: '#F87171', fontSize: 16, textAlign: 'center' },
  blockTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  blockSub: { color: '#E2E8F0', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  meta: { color: '#94A3B8', fontSize: 12, marginTop: 16 },
});
