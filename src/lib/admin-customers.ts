import { createServiceSupabase } from "@/lib/supabase/admin";
import { DEFAULT_CAFE_ID } from "@/lib/utils";
import { isValidPhone, normalizePhone } from "@/lib/guest-crypto";

export type CatalogCustomer = {
  phone: string;
  name: string;
  email: string | null;
  emailVerified: boolean;
  registered: boolean;
  orderCount: number;
  spent: number;
  lastOrderAt: string | null;
  createdAt: string | null;
};

async function fetchAllRows<T extends Record<string, unknown>>(
  table: string,
  columns: string
): Promise<T[]> {
  const supabase = createServiceSupabase();
  if (!supabase) return [];
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; from < 20_000; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .eq("cafe_id", DEFAULT_CAFE_ID)
      .range(from, from + pageSize - 1);
    if (error || !data?.length) {
      if (error && from === 0) return [];
      break;
    }
    rows.push(...(data as T[]));
    if (data.length < pageSize) break;
  }
  return rows;
}

export async function getCatalogCustomers(): Promise<CatalogCustomer[]> {
  const [guests, orders] = await Promise.all([
    fetchAllRows<{
      name: string | null;
      phone: string | null;
      email: string | null;
      email_verified: boolean | null;
      created_at: string | null;
    }>("guest_customers", "name, phone, email, email_verified, created_at"),
    fetchAllRows<{
      guest_phone: string | null;
      guest_name: string | null;
      total: number | string | null;
      status: string | null;
      created_at: string | null;
    }>("customer_orders", "guest_phone, guest_name, total, status, created_at"),
  ]);

  const byPhone = new Map<string, CatalogCustomer>();

  function upsert(phoneRaw: string | null | undefined, name: string | null | undefined, extras?: Partial<CatalogCustomer>) {
    const phone = normalizePhone(phoneRaw || "");
    if (!isValidPhone(phone)) return;
    const existing = byPhone.get(phone);
    const nextName = String(name || "").trim();
    if (!existing) {
      byPhone.set(phone, {
        phone,
        name: nextName || "Guest",
        email: extras?.email ?? null,
        emailVerified: Boolean(extras?.emailVerified),
        registered: Boolean(extras?.registered),
        orderCount: extras?.orderCount ?? 0,
        spent: extras?.spent ?? 0,
        lastOrderAt: extras?.lastOrderAt ?? null,
        createdAt: extras?.createdAt ?? null,
      });
      return;
    }
    if (nextName && (existing.name === "Guest" || nextName.length > existing.name.length)) {
      existing.name = nextName;
    }
    if (extras?.email && !existing.email) existing.email = extras.email;
    if (extras?.emailVerified) existing.emailVerified = true;
    if (extras?.registered) existing.registered = true;
    if (extras?.createdAt && (!existing.createdAt || extras.createdAt < existing.createdAt)) {
      existing.createdAt = extras.createdAt;
    }
  }

  for (const guest of guests) {
    upsert(guest.phone, guest.name, {
      email: guest.email ? String(guest.email).trim().toLowerCase() : null,
      emailVerified: Boolean(guest.email_verified),
      registered: true,
      createdAt: guest.created_at,
    });
  }

  for (const order of orders) {
    const status = String(order.status || "");
    if (status === "pending_submit") continue;
    upsert(order.guest_phone, order.guest_name);
    if (status === "cancelled") continue;
    const phone = normalizePhone(order.guest_phone || "");
    const row = byPhone.get(phone);
    if (!row) continue;
    row.orderCount += 1;
    row.spent += Number(order.total) || 0;
    if (!row.lastOrderAt || (order.created_at && order.created_at > row.lastOrderAt)) {
      row.lastOrderAt = order.created_at;
    }
  }

  return [...byPhone.values()].sort((a, b) => {
    const aTime = a.lastOrderAt || a.createdAt || "";
    const bTime = b.lastOrderAt || b.createdAt || "";
    return bTime.localeCompare(aTime);
  });
}
