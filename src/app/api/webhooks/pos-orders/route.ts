import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { DEFAULT_CAFE_ID } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { getClientIp } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";

function validSignature(body: string, header: string | null, secret: string) {
  if (!header) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const limited = rateLimit(`pos-webhook:${ip}`, 60, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const secret = (process.env.POS_WEBHOOK_SECRET ?? "").trim();
  if (!secret) {
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("x-webhook-signature");
  if (!validSignature(body, signature, secret)) {
    await trackEvent("webhook_failed", { reason: "bad_signature" });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    event?: string;
    order_id?: string;
    order_number?: string;
    status?: string;
    payment_status?: string;
    items?: unknown;
    total?: number;
  };
  try {
    payload = JSON.parse(body) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  if (supabase && (payload.order_id || payload.order_number)) {
    const cancelled = payload.event === "order.deleted" || payload.status === "cancelled";
    const patch: Record<string, unknown> = {
      status: cancelled ? "cancelled" : payload.status ? String(payload.status).toLowerCase() : undefined,
      payment_status: payload.payment_status ?? undefined,
      pos_order_number: payload.order_number ?? undefined,
      updated_at: new Date().toISOString(),
    };
    if (Array.isArray(payload.items)) patch.items = payload.items;
    if (payload.total != null && Number.isFinite(Number(payload.total))) {
      patch.total = Number(payload.total);
    }
    const cleanPatch = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
    if (payload.order_id) {
      const { error } = await supabase
        .from("customer_orders")
        .update(cleanPatch)
        .eq("pos_order_id", String(payload.order_id))
        .eq("cafe_id", DEFAULT_CAFE_ID);
      if (error) {
        await trackEvent("webhook_failed", { reason: error.message, orderId: payload.order_id });
        return NextResponse.json({ ok: true, warning: "order not updated" });
      }
    }
    if (payload.order_number) {
      await supabase
        .from("customer_orders")
        .update(cleanPatch)
        .eq("pos_order_number", String(payload.order_number))
        .eq("cafe_id", DEFAULT_CAFE_ID);
    }
  }

  await trackEvent("order_status_updated", {
    event: payload.event ?? null,
    posOrderId: payload.order_id ?? null,
    status: payload.status ?? null,
    payment_status: payload.payment_status ?? null,
  });

  return NextResponse.json({ ok: true });
}
