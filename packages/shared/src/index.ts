/**
 * 웹과 모바일이 공유하는 타입/상수.
 * 비즈니스 로직(결제/구독)은 웹에만 존재해야 함.
 */

export const APP_SCHEME = 'proweb';

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';

export type Subscription = {
  status: SubscriptionStatus;
  plan: string | null;
  currentPeriodEnd: string | null;
};
