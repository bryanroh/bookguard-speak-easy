import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { I18nProvider } from "@/lib/i18n";
import { useSessionGuard, setLocalSessionToken, getLocalSessionToken, clearLocalSessionToken } from "@/hooks/use-session-guard";
import { registerSession } from "@/lib/session.functions";
import { getDeviceFingerprint } from "@/lib/device-fingerprint";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-4 text-muted-foreground">페이지를 찾을 수 없습니다.</p>
        <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">홈으로</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">문제가 발생했습니다</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >다시 시도</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Institute for Providence Theology — 섭리신학연구소" },
      {
        name: "description",
        content:
          "Institute for Providence Theology (섭리신학연구소) — an independent academic research institute publishing scholarly digital works in theology, philosophy, and the humanities.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Institute for Providence Theology" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "Institute for Providence Theology",
          alternateName: ["섭리신학연구소", "Providence Theology Research Institute"],
          description:
            "An independent academic research institute publishing scholarly digital works in the fields of theology, philosophy, and the humanities.",
          url: "https://bookguard-speak-easy.lovable.app",
          knowsAbout: ["Theology", "Philosophy", "Humanities", "Religious Studies", "Academic Publishing"],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <SessionManager />
        <Outlet />
        <Toaster richColors position="top-center" />
      </I18nProvider>
    </QueryClientProvider>
  );
}

function SessionManager() {
  const router = useRouter();
  useSessionGuard();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      router.invalidate();
      if (event === "SIGNED_IN" && session?.user) {
        // Only register once per fresh sign-in (not on token refresh)
        if (!getLocalSessionToken()) {
          try {
            const fingerprint = await getDeviceFingerprint();
            const res = await registerSession({ data: { fingerprint } });
            setLocalSessionToken(res.sessionToken);
          } catch (e) {
            console.warn("[session] register failed", e);
          }
        }
      }
      if (event === "SIGNED_OUT") {
        clearLocalSessionToken();
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);
  return null;
}
