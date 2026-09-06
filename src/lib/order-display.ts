import { DEFAULT_CATEGORIES, type Dish } from "@/data/menuData";

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

export type CategoryRailItem = {
  name: string;
  count: number;
  image: string;
};

export function isExtraCategory(name: string) {
  return /^top+ings?$/i.test(name.trim());
}

export function dishCategoriesInOrder(dishes: Dish[]): string[] {
  const present = new Set(dishes.map((dish) => dish.category).filter(Boolean));
  const known = DEFAULT_CATEGORIES.filter((name) => name !== "All" && present.has(name));
  const rest = [...present]
    .filter((name) => !DEFAULT_CATEGORIES.includes(name))
    .sort((a, b) => a.localeCompare(b));
  return [...known, ...rest];
}

export function compareMenuDish(a: Dish, b: Dish) {
  if (Boolean(a.popular) !== Boolean(b.popular)) return a.popular ? -1 : 1;
  if (Number(b.rating) !== Number(a.rating)) return Number(b.rating) - Number(a.rating);
  return a.name.localeCompare(b.name);
}

export function sortOrderMenuDishes(dishes: Dish[]): Dish[] {
  const cats = dishCategoriesInOrder(dishes);
  const rank = (category: string) => {
    const index = cats.indexOf(category);
    return index < 0 ? 999 : index;
  };
  return [...dishes].sort((a, b) => {
    const byCategory = rank(a.category) - rank(b.category);
    if (byCategory !== 0) return byCategory;
    return compareMenuDish(a, b);
  });
}

export function mostPopularDish(dishes: Dish[]): Dish | null {
  if (!dishes.length) return null;
  return [...dishes].sort(compareMenuDish)[0] ?? null;
}

export function buildCategoryRail(dishes: Dish[]): CategoryRailItem[] {
  const map = new Map<string, CategoryRailItem>();
  for (const dish of dishes) {
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
  const ordered = dishCategoriesInOrder(dishes)
    .map((name) => map.get(name))
    .filter((item): item is CategoryRailItem => Boolean(item));
  return [{ name: "All", count: dishes.length, image: "/adda.png" }, ...ordered];
}

export type ItemExtras = {
  note: string;
  extraCheeseQty?: number;
};

export const EXTRA_CHEESE_PRICE = 10;
export const EXTRA_CHEESE_MAX = 10;

export function extraCheeseQty(extras?: ItemExtras) {
  return Math.max(0, Math.min(EXTRA_CHEESE_MAX, Number(extras?.extraCheeseQty) || 0));
}

export function allowsCheeseAddon(dish: Dish) {
  return !isDrink(dish) && !isExtraCategory(dish.category);
}

export function findExtraCheeseDish(dishes: Dish[]) {
  return dishes.find(
    (dish) =>
      /x-?tra\s*cheese|extra\s*cheese/i.test(dish.name) ||
      (isExtraCategory(dish.category) && /cheese/i.test(dish.name))
  );
}

export function extraCheesePrice(dishes: Dish[]) {
  const topping = findExtraCheeseDish(dishes);
  return topping ? Number(topping.price) || EXTRA_CHEESE_PRICE : EXTRA_CHEESE_PRICE;
}

export function lineItemTotal(dish: Dish, quantity: number, extras?: ItemExtras, dishes?: Dish[]) {
  const cheese = allowsCheeseAddon(dish) ? extraCheeseQty(extras) : 0;
  const cheeseCost = cheese * (dishes ? extraCheesePrice(dishes) : EXTRA_CHEESE_PRICE);
  return dish.price * Math.max(1, quantity) + cheeseCost;
}

export function extrasLabel(extras?: ItemExtras) {
  if (!extras) return "";
  const cheese = extraCheeseQty(extras);
  const bits = [cheese > 0 ? `Cheese ×${cheese}` : "", extras.note].filter(Boolean);
  return bits.join(" · ");
}

export function isDrink(dish: Dish) {
  const category = dish.category.toLowerCase();
  return (
    category.includes("beverage") ||
    category.includes("coffee") ||
    category.includes("tea") ||
    category.includes("drink")
  );
}

export function normalizeOrderStatus(status: string) {
  const value = String(status || "").trim().toLowerCase();
  if (["cancelled", "canceled", "deleted", "void"].includes(value)) return "cancelled";
  if (["served", "completed", "complete"].includes(value)) return "served";
  if (["ready", "prepared", "done"].includes(value)) return "ready";
  if (["preparing", "submitted", "accepted", "confirmed"].includes(value)) return "preparing";
  if (["pending", "pending_submit"].includes(value)) return "pending";
  return value || "pending";
}

export function mapKitchenStatus(status: string) {
  const value = normalizeOrderStatus(status);
  if (value === "cancelled") return -1;
  if (value === "served") return 3;
  if (value === "ready") return 2;
  if (value === "preparing") return 1;
  return 0;
}

export function isCancelledStatus(status: string) {
  return normalizeOrderStatus(status) === "cancelled";
}

export const TRACK_STEPS = ["Waiting for staff", "Preparing", "Ready", "Served"] as const;
