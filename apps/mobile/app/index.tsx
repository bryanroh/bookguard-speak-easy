import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

const WEB_BASE_URL =
  (Constants.expoConfig?.extra?.WEB_BASE_URL as string) ?? 'https://example.com';

export default function Home() {
  const router = useRouter();

  // 핵심 원칙: 결제는 절대 앱 내부에서 처리하지 않음.
  // 외부 브라우저(Safari/Chrome)로 결제 페이지를 열어 Paddle 결제 진행.
  const openSubscription = async () => {
    await WebBrowser.openBrowserAsync(`${WEB_BASE_URL}/pricing?from=app`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ProWeb</Text>
      <Text style={styles.subtitle}>섭리신학연구소 웹북</Text>

      <Pressable style={styles.btn} onPress={() => router.push('/library')}>
        <Text style={styles.btnText}>도서관 열기</Text>
      </Pressable>

      <Pressable style={[styles.btn, styles.outline]} onPress={openSubscription}>
        <Text style={styles.btnText}>구독하기 (브라우저)</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 32, fontWeight: '700' },
  subtitle: { color: '#94A3B8', marginTop: 8, marginBottom: 40 },
  btn: { backgroundColor: '#3B82F6', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, marginTop: 12, minWidth: 240, alignItems: 'center' },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3B82F6' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
