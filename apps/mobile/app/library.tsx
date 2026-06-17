import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import * as ScreenCapture from 'expo-screen-capture';
import JailMonkey from 'jail-monkey';

const WEB_BASE_URL =
  (Constants.expoConfig?.extra?.WEB_BASE_URL as string) ?? 'https://example.com';

export default function Library() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // 루팅/탈옥 감지 (핵심 원칙: 보안 우선)
    if (JailMonkey.isJailBroken()) {
      setBlocked(true);
      Alert.alert('보안 경고', '루팅/탈옥된 기기에서는 콘텐츠를 열람할 수 없습니다.');
      return;
    }

    // iOS: 화면 녹화 감지 시 콘텐츠 가림
    const sub = ScreenCapture.addScreenshotListener(() => {
      Alert.alert('알림', '스크린샷이 감지되었습니다. 콘텐츠는 저작권 보호 대상입니다.');
    });
    return () => sub.remove();
  }, []);

  if (blocked) {
    return (
      <View style={styles.center}>
        <Text style={styles.warn}>이 기기에서는 콘텐츠를 열람할 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: `${WEB_BASE_URL}/library?from=app` }}
      style={{ flex: 1, backgroundColor: '#0F172A' }}
      // 결제 URL이 WebView 안에서 열리면 외부 브라우저로 보냄
      onShouldStartLoadWithRequest={(req) => {
        if (req.url.includes('/checkout') || req.url.includes('paddle.com')) {
          // 외부 브라우저로 열기
          return false;
        }
        return true;
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', padding: 24 },
  warn: { color: '#F87171', fontSize: 16, textAlign: 'center' },
});
