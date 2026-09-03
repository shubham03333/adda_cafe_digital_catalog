import { createServiceSupabase } from "@/lib/supabase/admin";
import { DEFAULT_CAFE_ID } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { posFetch } from "@/lib/pos/client";

type PosMenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  is_available: boolean;
  position: number | null;
  image_url: string | null;
};

type PosMenuResponse = {
  items: PosMenuItem[];
  synced_at?: string;
  content_hash?: string;
};

export type MenuSyncResult = {
  ok: boolean;
  count: number;
  message: string;
  syncedAt: string;
};

async function writeLog(ok: boolean, message: string, count: number) {
  const supabase = createServiceSupabase();
  if (!supabase) return;
  try {
    await supabase.from("sync_log").insert({
      cafe_id: DEFAULT_CAFE_ID,
      job: "menu",
      ok,
      message,
      item_count: count,
    });
  } catch {
    // sync_log may not exist until the migration is applied
  }
}

export async function getLastMenuSync() {
  const supabase = createServiceSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("sync_log")
    .select("ok, message, item_count, created_at")
    .eq("cafe_id", DEFAULT_CAFE_ID)
    .eq("job", "menu")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  if (!data) return null;
  return {
    ok: Boolean(data.ok),
    message: data.message == null ? null : String(data.message),
    item_count: data.item_count == null ? null : Number(data.item_count),
    created_at: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
  };
}

export async function syncMenuFromPos(): Promise<MenuSyncResult> {
  const supabase = createServiceSupabase();
  const syncedAt = new Date().toISOString();
  if (!supabase) {
    return { ok: false, count: 0, message: "Supabase is not configured", syncedAt };
  }

  try {
    const payload = await posFetch<PosMenuResponse>("/api/integrations/menu?include_unavailable=true");
    const items = payload.items ?? [];

    const { data: existingRows } = await supabase
      .from("menu_items")
      .select("id, pos_menu_item_id, rating, popular, image")
      .eq("cafe_id", DEFAULT_CAFE_ID)
      .not("pos_menu_item_id", "is", null);

    const existing = new Map(
      (existingRows ?? []).map((row) => [Number(row.pos_menu_item_id), row])
    );

    for (const item of items) {
      const current = existing.get(Number(item.id));
      const row = {
        cafe_id: DEFAULT_CAFE_ID,
        pos_menu_item_id: Number(item.id),
        name: item.name,
        description: item.description ?? "",
        price: Number(item.price),
        category: item.category || "Main Course",
        available: Boolean(item.is_available),
        sort_order: item.position ?? 0,
        updated_at: syncedAt,
        image: current?.image || "",
        rating: current?.rating ?? 4,
        popular: current?.popular ?? false,
      };

      if (current?.id) {
        const { error } = await supabase.from("menu_items").update(row).eq("id", current.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("menu_items").insert(row);
        if (error) throw new Error(error.message);
      }
    }

    const posIds = items.map((item) => Number(item.id)).filter((id) => Number.isInteger(id) && id > 0);
    await supabase
      .from("menu_items")
      .update({ available: false, updated_at: syncedAt })
      .eq("cafe_id", DEFAULT_CAFE_ID)
      .is("pos_menu_item_id", null);
    if (posIds.length) {
      await supabase
        .from("menu_items")
        .update({ available: false, updated_at: syncedAt })
        .eq("cafe_id", DEFAULT_CAFE_ID)
        .not("pos_menu_item_id", "is", null)
        .not("pos_menu_item_id", "in", `(${posIds.join(",")})`);
    }

    const message = `Synced ${items.length} dishes from POS`;
    await writeLog(true, message, items.length);
    await trackEvent("menu_sync", { count: items.length, hash: payload.content_hash ?? null });
    return { ok: true, count: items.length, message, syncedAt };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Menu sync failed";
    await writeLog(false, message, 0);
    await trackEvent("menu_sync_failed", { message });
    return { ok: false, count: 0, message, syncedAt };
  }
}
