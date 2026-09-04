import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

const TITLE = "결제 완료 — 섭리신학연구소 웹북";
const DESC = "멤버십 결제가 완료되었습니다. 이제 전체 학술 총서를 열람하실 수 있습니다.";

export const Route = createFileRoute("/checkout/success")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CheckoutSuccessPage,
});

function CheckoutSuccessPage() {
  const t = useT();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <h1 className="mt-6 font-serif text-2xl font-bold">{t("success.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("success.body")}</p>
        <Link to="/library" className="mt-8 inline-block">
          <Button size="lg">{t("success.cta")}</Button>
        </Link>
      </main>
    </div>
  );
}
