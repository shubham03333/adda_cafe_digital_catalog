import { createServiceSupabase } from "@/lib/supabase/admin";
import { DEFAULT_CAFE_ID } from "@/lib/utils";
import { isValidPhone, normalizePhone } from "@/lib/guest-crypto";
import type { WaiterGuestContext } from "@/lib/ai/waiter-prompt";

function parseItems(value: unknown): { name: string; quantity: number }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const name = String(item.name || "").trim();
      if (!name) return null;
      return { name, quantity: Math.max(1, Number(item.quantity) || 1) };
    })
    .filter((item): item is { name: string; quantity: number } => Boolean(item));
}

export async function buildWaiterGuestContext(input: {
  name?: string;
  phone?: string;
}): Promise<WaiterGuestContext> {
  const name = String(input.name || "").trim();
  const phone = normalizePhone(input.phone || "");
  if (!isValidPhone(phone)) {
    return { anonymous: true };
  }

  const supabase = createServiceSupabase();
  if (!supabase) {
    return { anonymous: !name, name: name || undefined };
  }

  const { data: orders } = await supabase
    .from("customer_orders")
    .select("items, total, created_at, status")
    .eq("cafe_id", DEFAULT_CAFE_ID)
    .eq("guest_phone", phone)
    .order("created_at", { ascending: false })
    .limit(20);

  const rows = orders ?? [];
  const counts = new Map<string, number>();
  let spent = 0;
  for (const row of rows) {
    spent += Number(row.total) || 0;
    for (const item of parseItems(row.items)) {
      counts.set(item.name, (counts.get(item.name) || 0) + item.quantity);
    }
  }
  const frequentlyOrdered = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([dish]) => dish);

  const { data: guest } = await supabase
    .from("guest_customers")
    .select("name, date_of_birth")
    .eq("cafe_id", DEFAULT_CAFE_ID)
    .eq("phone", phone)
    .maybeSingle();

  let previousReviews: string[] = [];
  try {
    const { data: reviews } = await supabase
      .from("feedback")
      .select("message")
      .eq("cafe_id", DEFAULT_CAFE_ID)
      .order("created_at", { ascending: false })
      .limit(3);
    previousReviews = (reviews ?? []).map((row) => String(row.message || "").slice(0, 120)).filter(Boolean);
  } catch {
    previousReviews = [];
  }

  return {
    anonymous: false,
    name: guest?.name || name || undefined,
    visitCount: rows.length,
    favouriteDishes: frequentlyOrdered.slice(0, 3),
    averageSpend: rows.length ? Math.round(spent / rows.length) : 0,
    lastVisit: rows[0]?.created_at ? String(rows[0].created_at).slice(0, 10) : null,
    frequentlyOrdered,
    previousReviews,
    birthday: guest?.date_of_birth ? String(guest.date_of_birth).slice(0, 10) : null,
  };
}
