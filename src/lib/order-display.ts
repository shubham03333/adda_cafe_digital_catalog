import type { Dish } from "@/data/menuData";

const NON_VEG = /chicken|egg|mutton|fish|prawn|keema|non[-\s]?veg/i;

export function isVegDish(dish: Dish) {
  return !NON_VEG.test(`${dish.name} ${dish.description} ${dish.category}`);
}

export function prepMinutes(dish: Dish) {
  const category = dish.category.toLowerCase();
  if (category.includes("beverage") || category.includes("coffee") || category.includes("tea")) return 4;
  if (category.includes("fries") || category.includes("snack")) return 8;
  if (category.includes("combo") || category.includes("platter")) return 12;
  if (category.includes("burger") || category.includes("main")) return 10;
  return 8;
}

export function isBestSeller(dish: Dish) {
  return dish.popular || dish.rating >= 4.5;
}

export type QuickFilter =
  | "all"
  | "veg"
  | "coffee"
  | "tea"
  | "snacks"
  | "desserts"
  | "popular"
  | "new"
  | "combo"
  | "best";

export const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "veg", label: "Veg" },
  { id: "coffee", label: "Coffee" },
  { id: "tea", label: "Tea" },
  { id: "snacks", label: "Snacks" },
  { id: "desserts", label: "Desserts" },
  { id: "popular", label: "Top sellers" },
  { id: "new", label: "New" },
  { id: "combo", label: "Combo" },
  { id: "best", label: "Best seller" },
];

function haystack(dish: Dish) {
  return `${dish.name} ${dish.description} ${dish.category}`.toLowerCase();
}

export function matchesFilter(dish: Dish, filter: QuickFilter) {
  if (filter === "all") return true;
  if (filter === "veg") return isVegDish(dish);
  if (filter === "popular") return dish.popular;
  if (filter === "best") return isBestSeller(dish);
  if (filter === "combo") return haystack(dish).includes("combo") || dish.category.toLowerCase().includes("platter");
  if (filter === "coffee") return haystack(dish).includes("coffee");
  if (filter === "tea") return haystack(dish).includes("tea");
  if (filter === "snacks") return /fries|snack|roll|sandwich|bhel|burger/i.test(haystack(dish));
  if (filter === "desserts") return /dessert|sweet|brownie|cake|ice cream/i.test(haystack(dish));
  if (filter === "new") return typeof dish.id === "number" && dish.id >= 17;
  return true;
}

export type CategoryRailItem = {
  name: string;
  count: number;
  image: string;
};

export function buildCategoryRail(dishes: Dish[]): CategoryRailItem[] {
  const map = new Map<string, CategoryRailItem>();
  for (const dish of dishes) {
    if (dish.category === "Topping") continue;
    const current = map.get(dish.category);
    if (current) {
      current.count += 1;
    } else {
      map.set(dish.category, {
        name: dish.category,
        count: 1,
        image: dish.image || "/adda.png",
      });
    }
  }
  return [{ name: "All", count: dishes.filter((d) => d.category !== "Topping").length, image: "/adda.png" }, ...map.values()];
}

export type ItemExtras = {
  note: string;
  sugar?: string;
  ice?: string;
};

export function extrasLabel(extras?: ItemExtras) {
  if (!extras) return "";
  const bits = [extras.sugar && `Sugar: ${extras.sugar}`, extras.ice && `Ice: ${extras.ice}`, extras.note].filter(Boolean);
  return bits.join(" · ");
}

export function isDrink(dish: Dish) {
  const hay = `${dish.category} ${dish.name}`.toLowerCase();
  return hay.includes("beverage") || hay.includes("coffee") || hay.includes("tea") || hay.includes("mocktail");
}

export function mapKitchenStatus(status: string) {
  const value = status.toLowerCase();
  if (value === "cancelled" || value === "canceled" || value === "deleted") return -1;
  if (value === "served") return 3;
  if (value === "ready") return 2;
  if (value === "preparing" || value === "submitted") return 1;
  return 0;
}

export const TRACK_STEPS = ["Order received", "Preparing", "Ready", "Served"] as const;
