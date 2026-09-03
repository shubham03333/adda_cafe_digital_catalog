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

export type CategoryRailItem = {
  name: string;
  count: number;
  image: string;
};

export function isExtraCategory(name: string) {
  return /^top+ings?$/i.test(name.trim());
}

export function buildCategoryRail(dishes: Dish[]): CategoryRailItem[] {
  const map = new Map<string, CategoryRailItem>();
  for (const dish of dishes) {
    if (isExtraCategory(dish.category)) continue;
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
  return [{ name: "All", count: dishes.filter((d) => !isExtraCategory(d.category)).length, image: "/adda.png" }, ...map.values()];
}

export type ItemExtras = {
  note: string;
  extraCheese?: boolean;
};

export const EXTRA_CHEESE_PRICE = 10;

export function isRoll(dish: Dish) {
  return /roll/i.test(dish.name);
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

export function lineItemUnitPrice(dish: Dish, extras?: ItemExtras, dishes?: Dish[]) {
  const base = dish.price;
  if (!extras?.extraCheese || !isRoll(dish)) return base;
  return base + (dishes ? extraCheesePrice(dishes) : EXTRA_CHEESE_PRICE);
}

export function lineItemTotal(dish: Dish, quantity: number, extras?: ItemExtras, dishes?: Dish[]) {
  return lineItemUnitPrice(dish, extras, dishes) * Math.max(1, quantity);
}

export function extrasLabel(extras?: ItemExtras) {
  if (!extras) return "";
  const bits = [extras.extraCheese ? "Extra cheese" : "", extras.note].filter(Boolean);
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
  if (value === "pending") return 0;
  return 0;
}

export const TRACK_STEPS = ["Waiting for staff", "Preparing", "Ready", "Served"] as const;
