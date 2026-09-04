import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/lib/i18n";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { getMySubscription } from "@/utils/payments.functions";

const TITLE = "구독 — 섭리신학연구소 웹북 멤버십";
const DESC =
  "섭리신학연구소 디지털 학술 도서관 멤버십. 전체 학술 총서 열람, 음성 낭독, 기기 간 동기화를 제공합니다.";
const URL = "https://bookguard-speak-easy.lovable.app/pricing";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "product" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: PricingPage,
});

// Human-readable price IDs. Prices are created in the payments catalog.
const PLANS = [
  { priceId: "membership_monthly", labelKey: "pricing.monthly" },
  { priceId: "membership_yearly", labelKey: "pricing.yearly" },
] as const;

function PricingPage() {
  const t = useT();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openCheckout, loading } = usePaddleCheckout();
  const [sub, setSub] = useState<{ active: boolean; end: string | null } | null>(null);

  useEffect(() => {
    if (!user) {
      setSub(null);
      return;
    }
    getMySubscription()
      .then((r) => setSub({ active: r.active, end: r.subscription?.current_period_end ?? null }))
      .catch(() => setSub(null));
  }, [user]);

  const subscribe = async (priceId: string) => {
    if (!user) {
      toast.error(t("pricing.loginFirst"));
      navigate({ to: "/login" });
      return;
    }
    try {
      await openCheckout({
        priceId,
        customerEmail: user.email ?? undefined,
        customData: { userId: user.id },
        successUrl: `${window.location.origin}/checkout/success`,
      });
    } catch (e) {
      toast.error(t("pricing.soon"));
      console.warn("[paddle] checkout failed", e);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-14">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">{t("pricing.title")}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t("pricing.subtitle")}</p>

        {sub?.active && (
          <div className="mt-6 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-700">
            <ShieldCheck className="mr-1 inline h-4 w-4" />
            {t("pricing.active")}
            {sub.end && ` · ${t("pricing.until")}: ${new Date(sub.end).toLocaleDateString()}`}
          </div>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {PLANS.map((p) => (
            <div key={p.priceId} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-serif text-xl font-semibold">{t(p.labelKey)}</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {["pricing.f1", "pricing.f2", "pricing.f3", "pricing.f4"].map((k) => (
                  <li key={k} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{t(k)}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                disabled={loading}
                onClick={() => subscribe(p.priceId)}
              >
                {t("pricing.cta")}
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-muted-foreground">{t("pricing.mor")}</p>
      </main>
    </div>
  );
}
