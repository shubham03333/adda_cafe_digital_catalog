"use server";

import { createServiceSupabase } from "@/lib/supabase/admin";
import { DEFAULT_CAFE_ID } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { isOrderingEnabled, posConfigured } from "@/lib/pos/config";
import { getOrderStatus, submitOrderToPos } from "@/lib/pos/order-client";
import { resolvePosTableCode } from "@/lib/pos/table-map";
import { PosApiError } from "@/lib/pos/client";
import { isValidPhone, normalizePhone } from "@/lib/guest-crypto";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

export async function placeOrder(input: {
  tableNumber: number;
  items: CartItem[];
  total: number;
  sessionId: string;
  idempotencyKey: string;
  notes?: string;
  customerName?: string;
  customerPhone?: string;
}) {
  if (!isOrderingEnabled()) {
    return { ok: false as const, error: "Ordering is not enabled yet." };
  }
  if (!posConfigured()) {
    return { ok: false as const, error: "Kitchen connection is not configured. You can still browse the menu." };
  }
  if (!Number.isInteger(input.tableNumber) || input.tableNumber < 1) {
    return { ok: false as const, error: "A valid table is required." };
  }
  if (!input.items.length) {
    return { ok: false as const, error: "Add at least one dish." };
  }
  const customerName = String(input.customerName || "").trim();
  const customerPhone = normalizePhone(input.customerPhone || "");
  if (customerName.length < 2) {
    return { ok: false as const, error: "Enter your name before placing an order." };
  }
  if (!isValidPhone(customerPhone)) {
    return { ok: false as const, error: "Enter a valid mobile number before placing an order." };
  }

  const supabase = createServiceSupabase();
  const tableCode = await resolvePosTableCode(input.tableNumber);
  const computed = input.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  if (Math.abs(computed - Number(input.total)) > 0.01) {
    return { ok: false as const, error: "Cart total does not match." };
  }

  const local = {
    cafe_id: DEFAULT_CAFE_ID,
    table_number: input.tableNumber,
    idempotency_key: input.idempotencyKey,
    status: "pending_submit",
    payment_status: "pending",
    items: input.items,
    total: Number(computed.toFixed(2)),
    session_id: input.sessionId,
    guest_name: customerName,
    guest_phone: customerPhone,
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data: existing } = await supabase
      .from("customer_orders")
      .select("id, pos_order_id, pos_order_number, status, payment_status, total")
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (existing?.pos_order_id) {
      return {
        ok: true as const,
        orderId: existing.id,
        posOrderId: existing.pos_order_id,
        orderNumber: existing.pos_order_number,
        status: existing.status,
        total: Number(existing.total),
      };
    }
    if (!existing) {
      const { error } = await supabase.from("customer_orders").insert(local);
      if (error) {
        const { guest_name: _n, guest_phone: _p, ...withoutGuest } = local;
        await supabase.from("customer_orders").insert(withoutGuest);
      }
    }
  }

  try {
    const created = await submitOrderToPos({
      idempotency_key: input.idempotencyKey,
      source: "digital_catalog",
      order_type: "DINE_IN",
      table_code: tableCode,
      items: input.items,
      total: Number(computed.toFixed(2)),
      customer_ref: input.sessionId,
      customer_name: customerName,
      customer_phone: customerPhone,
      notes: input.notes?.trim() || undefined,
    });

    if (supabase) {
      await supabase
        .from("customer_orders")
        .update({
          pos_order_id: created.id,
          pos_order_number: created.order_number,
          status: created.status || "submitted",
          updated_at: new Date().toISOString(),
        })
        .eq("idempotency_key", input.idempotencyKey);
    }

    await trackEvent("order_placed", {
      sessionId: input.sessionId,
      posOrderId: created.id,
      orderNumber: created.order_number,
      tableNumber: input.tableNumber,
    });

    const { data: saved } = supabase
      ? await supabase
          .from("customer_orders")
          .select("id")
          .eq("idempotency_key", input.idempotencyKey)
          .maybeSingle()
      : { data: null };

    return {
      ok: true as const,
      orderId: saved?.id ?? null,
      posOrderId: created.id,
      orderNumber: created.order_number,
      status: created.status,
      total: Number(computed.toFixed(2)),
    };
  } catch (error) {
    const raw =
      error instanceof PosApiError
        ? error.message
        : "Could not reach the kitchen. Please ask a waiter, or try again in a moment.";
    const message =
      /invalid or inactive table/i.test(raw)
        ? `Table ${input.tableNumber} is not an active POS table (expected code like T${String(input.tableNumber).padStart(2, "0")}).`
        : raw;
    await trackEvent("pos_api_error", { action: "place_order", message });
    return { ok: false as const, error: message };
  }
}

export async function getCustomerOrder(orderId: string) {
  const supabase = createServiceSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("customer_orders")
    .select("id, pos_order_id, pos_order_number, status, payment_status, items, total, table_number, updated_at, session_id")
    .eq("id", orderId)
    .eq("cafe_id", DEFAULT_CAFE_ID)
    .maybeSingle();
  if (!data) return null;

  if (data.pos_order_id && posConfigured() && data.status !== "cancelled") {
    try {
      const remote = await getOrderStatus(data.pos_order_id);
      await supabase
        .from("customer_orders")
        .update({
          status: remote.status,
          payment_status: remote.payment_status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);
      return { ...data, status: remote.status, payment_status: remote.payment_status };
    } catch (error) {
      if (error instanceof PosApiError && error.status === 404) {
        await supabase
          .from("customer_orders")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", data.id);
        return { ...data, status: "cancelled" };
      }
      return data;
    }
  }
  return data;
}

export async function getSessionOrderedNames(sessionId: string, tableNumber?: number | null) {
  const supabase = createServiceSupabase();
  if (!supabase || !sessionId) return [] as string[];
  let query = supabase
    .from("customer_orders")
    .select("items, created_at")
    .eq("cafe_id", DEFAULT_CAFE_ID)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (tableNumber) query = query.eq("table_number", tableNumber);
  const { data } = await query.maybeSingle();
  const items = Array.isArray(data?.items) ? data.items : [];
  return items
    .map((item) => {
      if (item && typeof item === "object" && "name" in item) return String((item as { name: string }).name);
      return "";
    })
    .filter(Boolean);
}
