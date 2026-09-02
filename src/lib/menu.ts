import { createServiceSupabase } from "@/lib/supabase/admin";
import { DEFAULT_CAFE_ID } from "@/lib/utils";
import { menuData, type Dish } from "@/data/menuData";
import { isPosMenuSync } from "@/lib/pos/config";

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

function mapRow(row: MenuRow): Dish {
  return {
    id: row.id,
    posMenuItemId: row.pos_menu_item_id ?? null,
    name: row.name,
    description: row.description ?? "",
    price: Number(row.price),
    category: row.category,
    rating: Number(row.rating),
    popular: row.popular,
    image: row.image || "/adda.png",
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

export async function getLiveMenu(): Promise<Dish[]> {
  try {
    const supabase = createServiceSupabase();
    if (!supabase) return menuData;
    await seedIfEmpty();
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, pos_menu_item_id, name, description, price, category, rating, popular, available, image, sort_order")
      .eq("cafe_id", DEFAULT_CAFE_ID)
      .eq("available", true)
      .order("sort_order", { ascending: true });
    if (error || !data?.length) return menuData;
    return data.map(mapRow);
  } catch {
    return menuData;
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
    return data.map((row) => ({
      ...mapRow(row as MenuRow),
      available: row.available,
      sort_order: row.sort_order,
    }));
  } catch {
    return menuData.map((dish, index) => ({ ...dish, available: true, sort_order: index + 1 }));
  }
}
