import { createServiceSupabase } from "@/lib/supabase/admin";
import { DEFAULT_CAFE_ID } from "@/lib/utils";
import { menuData, type Dish } from "@/data/menuData";
import { isPosMenuSync } from "@/lib/pos/config";
import { overlayPosStockouts } from "@/lib/pos-stockout";
import { unstable_noStore as noStore } from "next/cache";

type MenuRow = {
  id: string;
  pos_menu_item_id?: number | null;
  name: string;
  description: string | null;
  price: number | string;
  category: string;
  rating: number | string;
  popular: boolean;
  available: boolean;
  image: string | null;
  sort_order: number;
};

function safeImage(image: string | null | undefined) {
  const value = (image || "").trim();
  if (!value || value.startsWith("data:") || value.startsWith("blob:")) return "/adda.png";
  return value;
}

function mapRow(row: MenuRow): Dish {
  return {
    id: String(row.id),
    posMenuItemId: row.pos_menu_item_id ?? null,
    name: row.name,
    description: row.description ?? "",
    price: Number(row.price) || 0,
    category: row.category || "Main Course",
    rating: Number(row.rating) || 0,
    popular: Boolean(row.popular),
    image: safeImage(row.image),
  };
}

async function seedIfEmpty() {
  const supabase = createServiceSupabase();
  if (!supabase) return;
  const { count, error } = await supabase
    .from("menu_items")
    .select("id", { count: "exact", head: true })
    .eq("cafe_id", DEFAULT_CAFE_ID);
  if (error || (count && count > 0)) return;
  if (isPosMenuSync()) return;
  await supabase.from("menu_items").insert(
    menuData.map((dish, index) => ({
      cafe_id: DEFAULT_CAFE_ID,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      category: dish.category,
      rating: dish.rating,
      popular: dish.popular,
      available: true,
      image: dish.image,
      sort_order: index + 1,
    }))
  );
}

export async function getLiveMenu(options?: { overlayStockout?: boolean }): Promise<Dish[]> {
  const overlay = options?.overlayStockout !== false;
  if (overlay) noStore();
  try {
    const supabase = createServiceSupabase();
    if (!supabase) {
      const fallback = isPosMenuSync() ? [] : menuData;
      return overlay ? overlayPosStockouts(fallback) : fallback;
    }
    await seedIfEmpty();
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, pos_menu_item_id, name, description, price, category, rating, popular, available, image, sort_order")
      .eq("cafe_id", DEFAULT_CAFE_ID)
      .eq("available", true)
      .order("sort_order", { ascending: true });
    if (error) {
      const fallback = isPosMenuSync() ? [] : menuData;
      return overlay ? overlayPosStockouts(fallback) : fallback;
    }
    if (!data?.length) {
      const fallback = isPosMenuSync() ? [] : menuData;
      return overlay ? overlayPosStockouts(fallback) : fallback;
    }

    const mapped = data.map(mapRow);
    const uniqueList = (() => {
      if (!isPosMenuSync()) return mapped;
      const unique = new Map<number, Dish>();
      for (const dish of mapped) {
        const posId = Number(dish.posMenuItemId);
        if (!Number.isInteger(posId) || posId < 1) continue;
        if (!unique.has(posId)) unique.set(posId, dish);
      }
      return [...unique.values()];
    })();
    return overlay ? overlayPosStockouts(uniqueList) : uniqueList;
  } catch {
    const fallback = isPosMenuSync() ? [] : menuData;
    return overlay ? overlayPosStockouts(fallback) : fallback;
  }
}

export async function getAdminMenu(): Promise<(Dish & { available: boolean; sort_order: number })[]> {
  try {
    const supabase = createServiceSupabase();
    if (!supabase) {
      return menuData.map((dish, index) => ({ ...dish, available: true, sort_order: index + 1 }));
    }
    await seedIfEmpty();
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, pos_menu_item_id, name, description, price, category, rating, popular, available, image, sort_order")
      .eq("cafe_id", DEFAULT_CAFE_ID)
      .order("sort_order", { ascending: true });
    if (error || !data) {
      return menuData.map((dish, index) => ({ ...dish, available: true, sort_order: index + 1 }));
    }
    return data
      .filter((row) => !isPosMenuSync() || row.pos_menu_item_id)
      .map((row) => ({
        ...mapRow(row as MenuRow),
        available: row.available,
        sort_order: row.sort_order,
      }));
  } catch {
    return menuData.map((dish, index) => ({ ...dish, available: true, sort_order: index + 1 }));
  }
}
