"use server";

import { createServiceSupabase } from "@/lib/supabase/admin";
import { DEFAULT_CAFE_ID } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { isOrderingEnabled, posConfigured } from "@/lib/pos/config";
import { getOrderStatus, getOrderStatusByNumber, submitOrderToPos } from "@/lib/pos/order-client";
import { unstable_noStore as noStore } from "next/cache";
import { tableCodeFromNumber } from "@/lib/pos/table-map";
import { PosApiError } from "@/lib/pos/client";
import { isValidPhone, normalizePhone } from "@/lib/guest-crypto";
import { normalizeOrderStatus } from "@/lib/order-display";

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
  offerCode?: string;
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
  const tableCode = tableCodeFromNumber(input.tableNumber);
  const computed = input.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  if (Math.abs(computed - Number(input.total)) > 0.01) {
    return { ok: false as const, error: "Cart total does not match." };
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
      offer_code: input.offerCode || undefined,
    });

    void persistPlacedOrder({
      supabase,
      cafeId: DEFAULT_CAFE_ID,
      tableNumber: input.tableNumber,
      idempotencyKey: input.idempotencyKey,
      sessionId: input.sessionId,
      customerName,
      customerPhone,
      items: input.items,
      total: Number(computed.toFixed(2)),
      created,
    });

    return {
      ok: true as const,
      orderId: null,
      posOrderId: created.id,
      orderNumber: created.order_number,
      status: normalizeOrderStatus(created.status),
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
    void trackEvent("pos_api_error", { action: "place_order", message });
    return { ok: false as const, error: message };
  }
}

async function persistPlacedOrder(input: {
  supabase: ReturnType<typeof createServiceSupabase>;
  cafeId: string;
  tableNumber: number;
  idempotencyKey: string;
  sessionId: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  total: number;
  created: { id: string; order_number: string; status: string };
}) {
  const { supabase, created } = input;
  void trackEvent("order_placed", {
    sessionId: input.sessionId,
    posOrderId: created.id,
    orderNumber: created.order_number,
    tableNumber: input.tableNumber,
  });
  if (!supabase) return;

  const row = {
    cafe_id: input.cafeId,
    table_number: input.tableNumber,
    idempotency_key: input.idempotencyKey,
    status: normalizeOrderStatus(created.status || "pending"),
    payment_status: "pending",
    items: input.items,
    total: input.total,
    session_id: input.sessionId,
    guest_name: input.customerName,
    guest_phone: input.customerPhone,
    pos_order_id: created.id,
    pos_order_number: created.order_number,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("customer_orders").insert(row);
  if (error) {
    if (/guest_phone|guest_name|column/i.test(error.message)) {
      const { guest_name: _n, guest_phone: _p, ...withoutGuest } = row;
      await supabase.from("customer_orders").insert(withoutGuest);
    } else if (/duplicate|unique|idempotency/i.test(error.message)) {
      await supabase
        .from("customer_orders")
        .update({
          pos_order_id: created.id,
          pos_order_number: created.order_number,
          status: row.status,
          updated_at: row.updated_at,
        })
        .eq("idempotency_key", input.idempotencyKey);
    }
  }

  await supabase
    .from("customer_orders")
    .delete()
    .eq("cafe_id", input.cafeId)
    .eq("guest_phone", input.customerPhone)
    .eq("status", "pending_submit")
    .is("pos_order_id", null)
    .eq("total", input.total)
    .neq("idempotency_key", input.idempotencyKey);
}

export async function getCustomerOrder(
  orderId: string,
  posOrderId?: string | null,
  orderNumber?: string | null
) {
  noStore();
  const supabase = createServiceSupabase();

  const toClient = (
    row: {
      id?: string | null;
      pos_order_id?: string | null;
      pos_order_number?: string | null;
      status?: string | null;
      payment_status?: string | null;
      items?: unknown;
      total?: unknown;
      table_number?: number | null;
      updated_at?: string | null;
    },
    extras?: { status?: string; items?: unknown; total?: number }
  ) => {
    const items = parseOrderItems(extras?.items ?? row.items);
    return {
      id: row.id ?? null,
      posOrderId: row.pos_order_id ?? posOrderId ?? null,
      orderNumber: String(row.pos_order_number || orderNumber || ""),
      status: normalizeOrderStatus(extras?.status ?? row.status ?? "pending"),
      paymentStatus: row.payment_status,
      items,
      total: extras?.total != null ? Number(extras.total) : Number(row.total) || 0,
      tableNumber: row.table_number == null ? null : Number(row.table_number),
      updatedAt: row.updated_at,
    };
  };

  let data: {
    id: string;
    pos_order_id: string | null;
    pos_order_number: string | null;
    status: string;
    payment_status: string | null;
    items: unknown;
    total: unknown;
    table_number: number | null;
    updated_at: string | null;
  } | null = null;

  const selectCols =
    "id, pos_order_id, pos_order_number, status, payment_status, items, total, table_number, updated_at";

  if (supabase) {
    if (orderId) {
      const byId = await supabase
        .from("customer_orders")
        .select(selectCols)
        .eq("id", orderId)
        .eq("cafe_id", DEFAULT_CAFE_ID)
        .maybeSingle();
      data = byId.data;
    }
    if (!data && posOrderId) {
      const byPos = await supabase
        .from("customer_orders")
        .select(selectCols)
        .eq("pos_order_id", posOrderId)
        .eq("cafe_id", DEFAULT_CAFE_ID)
        .maybeSingle();
      data = byPos.data;
    }
    if (!data && orderNumber) {
      const byNumber = await supabase
        .from("customer_orders")
        .select(selectCols)
        .eq("pos_order_number", orderNumber)
        .eq("cafe_id", DEFAULT_CAFE_ID)
        .limit(1)
        .maybeSingle();
      data = byNumber.data;
    }
  }

  const remoteId = data?.pos_order_id || posOrderId || null;
  const remoteNumber = data?.pos_order_number || orderNumber || null;

  async function fetchPosOrder() {
    if (!posConfigured()) return null;
    if (remoteId) {
      try {
        return await getOrderStatus(String(remoteId));
      } catch (error) {
        if (!(error instanceof PosApiError && error.status === 404)) throw error;
        if (remoteNumber) {
          try {
            return await getOrderStatusByNumber(String(remoteNumber));
          } catch (inner) {
            if (inner instanceof PosApiError && inner.status === 404) throw error;
            throw inner;
          }
        }
        throw error;
      }
    }
    if (remoteNumber) return getOrderStatusByNumber(String(remoteNumber));
    return null;
  }

  if (remoteId || remoteNumber) {
    try {
      const remote = await fetchPosOrder();
      if (!remote) {
        return data ? toClient(data) : null;
      }
      const items = parseOrderItems(remote.items);
      const total = Number(remote.total);
      const status = normalizeOrderStatus(remote.status);
      if (supabase && data?.id) {
        await supabase
          .from("customer_orders")
          .update({
            status,
            payment_status: remote.payment_status,
            items,
            total,
            pos_order_id: remote.id || data.pos_order_id,
            pos_order_number: remote.order_number || data.pos_order_number,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.id);
      }
      return toClient(
        data || {
          pos_order_id: remote.id || remoteId,
          pos_order_number: remote.order_number || remoteNumber,
        },
        { status, items, total }
      );
    } catch (error) {
      if (error instanceof PosApiError && error.status === 404) {
        if (supabase && data?.id) {
          await supabase
            .from("customer_orders")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("id", data.id);
        }
        return toClient(data || { pos_order_id: remoteId, pos_order_number: remoteNumber }, { status: "cancelled" });
      }
      return data ? toClient(data) : null;
    }
  }

  return data ? toClient(data) : null;
}

export type GuestHistoryOrder = {
  orderId: string;
  posOrderId?: string | null;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  tableNumber: number | null;
  placedAt: string;
  items: { name: string; quantity: number; price: number }[];
};

function parseOrderItems(raw: unknown) {
  const items = Array.isArray(raw) ? raw : [];
  return items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { name?: unknown; quantity?: unknown; price?: unknown };
      const name = String(row.name || "").trim();
      if (!name) return null;
      return {
        name,
        quantity: Math.max(1, Number(row.quantity) || 1),
        price: Number(row.price) || 0,
      };
    })
    .filter((item): item is { name: string; quantity: number; price: number } => Boolean(item));
}

function historyFingerprint(order: GuestHistoryOrder) {
  const items = order.items
    .map((item) => `${item.quantity}x${item.name.trim().toLowerCase()}`)
    .sort()
    .join("|");
  return `${order.tableNumber ?? ""}|${order.total}|${items}`;
}

function dedupeGuestHistory(orders: GuestHistoryOrder[]) {
  const visible = orders.filter(
    (order) => order.status !== "pending_submit" && order.orderNumber && order.orderNumber !== "—"
  );

  const best = new Map<string, GuestHistoryOrder>();
  for (const order of visible) {
    const minute = Math.floor(new Date(order.placedAt).getTime() / (10 * 60 * 1000));
    const key = `${historyFingerprint(order)}|${minute}`;
    const current = best.get(key);
    if (!current || new Date(order.placedAt).getTime() > new Date(current.placedAt).getTime()) {
      best.set(key, order);
    }
  }

  return [...best.values()].sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
  );
}

export async function getGuestOrderHistory(phone: string) {
  const guestPhone = normalizePhone(phone);
  if (!isValidPhone(guestPhone)) {
    return { ok: false as const, error: "Enter a valid mobile number.", orders: [] as GuestHistoryOrder[] };
  }

  const supabase = createServiceSupabase();
  if (!supabase) {
    return { ok: true as const, orders: [] as GuestHistoryOrder[] };
  }

  try {
    const { data, error } = await supabase
      .from("customer_orders")
      .select(
        "id, pos_order_id, pos_order_number, status, payment_status, items, total, table_number, created_at, guest_phone"
      )
      .eq("cafe_id", DEFAULT_CAFE_ID)
      .eq("guest_phone", guestPhone)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      // guest_phone column missing until 004 is applied
      if (/guest_phone|column/i.test(error.message)) {
        return { ok: true as const, orders: [] as GuestHistoryOrder[] };
      }
      return { ok: false as const, error: "Could not load your orders.", orders: [] as GuestHistoryOrder[] };
    }

    const mapped: GuestHistoryOrder[] = (data || []).map((row) => ({
      orderId: String(row.id),
      posOrderId: row.pos_order_id ? String(row.pos_order_id) : null,
      orderNumber: String(row.pos_order_number || "—"),
      status: normalizeOrderStatus(String(row.status || "pending")),
      paymentStatus: String(row.payment_status || "pending"),
      total: Number(row.total) || 0,
      tableNumber: row.table_number == null ? null : Number(row.table_number),
      placedAt: String(row.created_at || new Date().toISOString()),
      items: parseOrderItems(row.items),
    }));

    return { ok: true as const, orders: dedupeGuestHistory(mapped) };
  } catch {
    return { ok: false as const, error: "Could not load your orders.", orders: [] as GuestHistoryOrder[] };
  }
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
