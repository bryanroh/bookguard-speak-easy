import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { verifySession } from "@/lib/session.functions";
import { getDeviceFingerprint } from "@/lib/device-fingerprint";

const SESSION_TOKEN_KEY = "spr_session_token";
const POLL_MS = 20_000;

export function setLocalSessionToken(token: string) {
  try { localStorage.setItem(SESSION_TOKEN_KEY, token); } catch {}
}
export function getLocalSessionToken(): string | null {
  try { return localStorage.getItem(SESSION_TOKEN_KEY); } catch { return null; }
}
export function clearLocalSessionToken() {
  try { localStorage.removeItem(SESSION_TOKEN_KEY); } catch {}
}

/**
 * Polls verify-session every 20s. If invalid (different device logged in,
 * fingerprint mismatch, or no record) → force sign out.
 */
export function useSessionGuard() {
  const navigate = useNavigate();
  const busy = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    const check = async () => {
      if (busy.current) return;
      busy.current = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return; // not logged in — nothing to guard
        const sessionToken = getLocalSessionToken();
        if (!sessionToken) return; // freshly logged in elsewhere or pre-feature
        const fingerprint = await getDeviceFingerprint();
        const result = await verifySession({ data: { sessionToken, fingerprint } });
        if (cancelled) return;
        if (!result.valid) {
          const reason =
            result.reason === "replaced" ? "다른 기기에서 로그인되어"
            : result.reason === "fingerprint_mismatch" ? "디바이스 정보가 일치하지 않아"
            : "세션이 만료되어";
          toast.error(`${reason} 자동 로그아웃됩니다.`, { duration: 5000 });
          clearLocalSessionToken();
          await supabase.auth.signOut();
          navigate({ to: "/login" });
        }
      } catch (e) {
        console.warn("[session-guard] verify failed", e);
      } finally {
        busy.current = false;
      }
    };

    // first check after 5s so login flow has time to register session
    const initial = window.setTimeout(check, 5000);
    timer = window.setInterval(check, POLL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(initial);
      if (timer) window.clearInterval(timer);
    };
  }, [navigate]);
}
