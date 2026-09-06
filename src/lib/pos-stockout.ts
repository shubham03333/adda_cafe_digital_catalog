import { posConfigured } from "@/lib/pos/config";
import { posFetch } from "@/lib/pos/client";
import type { Dish } from "@/data/menuData";

type PosMenuItem = {
  id: number;
  out_of_stock?: boolean;
};

export async function fetchPosStockoutIds(): Promise<number[]> {
  if (!posConfigured()) return [];
  const payload = await posFetch<{ items?: PosMenuItem[] }>("/api/integrations/menu");
  return (payload.items ?? [])
    .filter((item) => item.out_of_stock)
    .map((item) => Number(item.id))
    .filter((id) => Number.isInteger(id) && id > 0);
}

export function applyStockoutIds(dishes: Dish[], ids: number[]): Dish[] {
  const oos = new Set(ids);
  return dishes.map((dish) => ({
    ...dish,
    outOfStock: oos.has(Number(dish.posMenuItemId)),
  }));
}

export async function overlayPosStockouts(dishes: Dish[]): Promise<Dish[]> {
  try {
    return applyStockoutIds(dishes, await fetchPosStockoutIds());
  } catch {
    return dishes;
  }
}
