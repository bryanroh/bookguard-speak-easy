// Server-only Paddle helpers. Never import from client code.
import { createHmac, timingSafeEqual } from "crypto";

export type PaddleEnv = "sandbox" | "live";

function apiBase(env: PaddleEnv) {
  return env === "sandbox" ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";
}

function apiKey(env: PaddleEnv) {
  const key =
    env === "sandbox" ? process.env["PADDLE_SANDBOX_API_KEY"] : process.env["PADDLE_LIVE_API_KEY"];
  if (!key) throw new Error(`Missing Paddle API key for ${env}`);
  return key;
}

export async function paddleFetch(env: PaddleEnv, path: string, init?: RequestInit) {
  const res = await fetch(`${apiBase(env)}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey(env)}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Paddle API ${res.status}: ${body.slice(0, 400)}`);
  }
  return res;
}

function webhookSecret(env: PaddleEnv) {
  const s =
    env === "sandbox"
      ? process.env["PAYMENTS_SANDBOX_WEBHOOK_SECRET"]
      : process.env["PAYMENTS_LIVE_WEBHOOK_SECRET"];
  if (!s) throw new Error(`Missing Paddle webhook secret for ${env}`);
  return s;
}

// Verifies the Paddle-Signature header (format: "ts=<unix>;h1=<hmac>").
export async function verifyWebhook(request: Request, env: PaddleEnv) {
  const header = request.headers.get("paddle-signature");
  if (!header) throw new Error("Missing Paddle-Signature header");

  const parts = Object.fromEntries(
    header.split(";").map((kv) => {
      const [k, ...rest] = kv.split("=");
      return [k.trim(), rest.join("=")];
    }),
  ) as { ts?: string; h1?: string };

  if (!parts.ts || !parts.h1) throw new Error("Malformed Paddle-Signature header");

  // Reject replays older than 5 minutes.
  const age = Math.abs(Date.now() / 1000 - Number(parts.ts));
  if (!Number.isFinite(age) || age > 300) throw new Error("Stale webhook timestamp");

  const raw = await request.text();
  const expected = createHmac("sha256", webhookSecret(env))
    .update(`${parts.ts}:${raw}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(parts.h1, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Invalid webhook signature");

  return JSON.parse(raw) as { event_type: string; data: Record<string, unknown> };
}
