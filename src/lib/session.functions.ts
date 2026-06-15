import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

function getClientIp(): string | null {
  try {
    return (
      getRequestIP({ xForwardedFor: true }) ??
      getRequestHeader("cf-connecting-ip") ??
      getRequestHeader("x-real-ip") ??
      null
    );
  } catch {
    return null;
  }
}

const FpSchema = z.object({
  fingerprint: z.string().min(16).max(128),
});

// Register a new session — invalidates any previous session for this user.
export const registerSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => FpSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sessionToken = crypto.randomUUID();
    const ip = getClientIp();
    const ua = getRequestHeader("user-agent") ?? null;

    // upsert by user_id (PRIMARY KEY) — replaces any prior session
    const { error } = await supabaseAdmin
      .from("active_sessions")
      .upsert({
        user_id: context.userId,
        session_token: sessionToken,
        device_fingerprint: data.fingerprint,
        ip,
        user_agent: ua,
        last_seen: new Date().toISOString(),
      });
    if (error) throw new Error(error.message);

    // ip log
    await supabaseAdmin.from("ip_log").insert({
      user_id: context.userId,
      ip: ip ?? "unknown",
      user_agent: ua,
      action: "login",
    });

    return { sessionToken };
  });

const VerifySchema = z.object({
  sessionToken: z.string().min(8).max(128),
  fingerprint: z.string().min(16).max(128),
});

// Verify the current session is still the active one for this user.
export const verifySession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => VerifySchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("active_sessions")
      .select("session_token, device_fingerprint")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!row) return { valid: false, reason: "no_session" as const };
    if (row.session_token !== data.sessionToken)
      return { valid: false, reason: "replaced" as const };
    if (row.device_fingerprint !== data.fingerprint)
      return { valid: false, reason: "fingerprint_mismatch" as const };

    // touch last_seen
    await supabaseAdmin
      .from("active_sessions")
      .update({ last_seen: new Date().toISOString() })
      .eq("user_id", context.userId);

    return { valid: true as const };
  });

// Log arbitrary user action with IP (used by capture events etc.)
export const logIpAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ action: z.string().min(1).max(64) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip = getClientIp();
    const ua = getRequestHeader("user-agent") ?? null;
    await supabaseAdmin.from("ip_log").insert({
      user_id: context.userId,
      ip: ip ?? "unknown",
      user_agent: ua,
      action: data.action,
    });
    return { ok: true };
  });
