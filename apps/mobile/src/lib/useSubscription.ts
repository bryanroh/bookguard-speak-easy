/**
 * 구독 상태 조회 훅
 * - 웹에서 Paddle 로 결제 → webhook 이 Supabase `subscriptions` 테이블 갱신
 * - 앱은 그 결과를 읽기만 함 (앱 내 결제 없음, Apple Reader App 정책 준수)
 */
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { SubscriptionStatus } from '@proweb/shared';

export type SubscriptionInfo = {
  status: SubscriptionStatus;
  loading: boolean;
  error: string | null;
  currentPeriodEnd: string | null;
};

export function useSubscription(): SubscriptionInfo {
  const [info, setInfo] = useState<SubscriptionInfo>({
    status: 'none',
    loading: true,
    error: null,
    currentPeriodEnd: null,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) setInfo({ status: 'none', loading: false, error: null, currentPeriodEnd: null });
        return;
      }
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', user.id)
        .order('current_period_end', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!mounted) return;
      if (error) {
        setInfo({ status: 'none', loading: false, error: error.message, currentPeriodEnd: null });
      } else {
        setInfo({
          status: (data?.status as SubscriptionStatus) ?? 'none',
          loading: false,
          error: null,
          currentPeriodEnd: data?.current_period_end ?? null,
        });
      }
    })();
    return () => { mounted = false; };
  }, []);

  return info;
}
