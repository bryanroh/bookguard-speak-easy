import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, type PaddleEnv } from "@/lib/paddle.server";

let _supabase: ReturnType<typeof createClient> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabase(): any {
  if (!_supabase) {
    _supabase = createClient(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    );
  }
  return _supabase;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const userId = data.custom_data?.userId;
  if (!userId) {
    console.error("[paddle] subscription without custom_data.userId", data.id);
    return;
  }
  const item = data.items?.[0];
  const priceId = item?.price?.import_meta?.external_id;
  const productId = item?.price?.product?.import_meta?.external_id ?? data.custom_data?.productId;
  if (!priceId || !productId) {
    console.warn("[paddle] missing importMeta.externalId", item?.price?.id);
    return;
  }

  await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        paddle_subscription_id: data.id,
        paddle_customer_id: data.customer_id,
        product_id: productId,
        price_id: priceId,
        status: data.status,
        current_period_start: data.current_billing_period?.starts_at ?? null,
        current_period_end: data.current_billing_period?.ends_at ?? null,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "paddle_subscription_id" },
    );
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({
      status: data.status,
      current_period_start: data.current_billing_period?.starts_at ?? null,
      current_period_end: data.current_billing_period?.ends_at ?? null,
      cancel_at_period_end: data.scheduled_change?.action === "cancel",
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
        try {
          const event = await verifyWebhook(request, env);
          switch (event.event_type) {
            case "subscription.created":
              await handleSubscriptionCreated(event.data, env);
              break;
            case "subscription.updated":
              await handleSubscriptionUpdated(event.data, env);
              break;
            case "subscription.canceled":
              await handleSubscriptionCanceled(event.data, env);
              break;
            default:
              console.log("[paddle] unhandled event", event.event_type);
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error("[paddle] webhook error", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
