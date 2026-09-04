import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EnvSchema = z.enum(["sandbox", "live"]);

// Resolve a human-readable price id (e.g. "membership_monthly") to the
// Paddle internal price id required by Paddle.js.
export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ priceId: z.string().min(1).max(64), environment: EnvSchema }).parse(data),
  )
  .handler(async ({ data }) => {
    const { paddleFetch } = await import("@/lib/paddle.server");
    const res = await paddleFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    const result = (await res.json()) as { data?: Array<{ id: string }> };
    if (!result.data?.length) throw new Error(`Price not found: ${data.priceId}`);
    return result.data[0].id;
  });

// Current user's subscription state (server-verified).
export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "paddle_subscription_id,product_id,price_id,status,current_period_end,cancel_at_period_end,environment",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return { active: false as const, subscription: null };

    const end = data.current_period_end ? new Date(data.current_period_end).getTime() : null;
    const notExpired = end === null || end > Date.now();
    const active =
      (["active", "trialing"].includes(data.status) && notExpired) ||
      (data.status === "canceled" && end !== null && end > Date.now());

    return { active, subscription: data };
  });
