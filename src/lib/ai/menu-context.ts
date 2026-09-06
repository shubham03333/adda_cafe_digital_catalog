import type { Dish } from "@/data/menuData";
import { isBestSeller, isExtraCategory, isVegDish, prepMinutes } from "@/lib/order-display";

function spiceLevel(dish: Dish): "none" | "mild" | "medium" | "hot" {
  const text = `${dish.name} ${dish.description}`.toLowerCase();
  if (/peri peri|schezwan|chilli|chili|spicy|masala|manchurian|tandoori/.test(text)) return "hot";
  if (/pepper|tikka|bbq/.test(text)) return "medium";
  if (/coffee|mocktail|lassi|shake|ice cream|brownie|dessert/.test(text)) return "none";
  return "mild";
}

function vegan(dish: Dish) {
  const text = `${dish.name} ${dish.description}`.toLowerCase();
  if (/cheese|paneer|mayo|butter|cream|milk/.test(text)) return false;
  return isVegDish(dish);
}

function jainFriendly(dish: Dish) {
  const text = `${dish.name} ${dish.description}`.toLowerCase();
  return !/onion|garlic|potato/.test(text) && isVegDish(dish);
}

function kidsFriendly(dish: Dish) {
  const text = `${dish.name} ${dish.description}`.toLowerCase();
  if (spiceLevel(dish) === "hot") return false;
  return /fries|burger|coffee|combo|cheese|mocktail|shake/.test(text) || dish.category === "Combo";
}

export type WaiterMenuDish = {
  id: string;
  posId: number | null;
  name: string;
  price: number;
  category: string;
  description: string;
  prepMinutes: number;
  veg: boolean;
  vegan: boolean;
  jain: boolean;
  spice: "none" | "mild" | "medium" | "hot";
  kids: boolean;
  available: boolean;
  bestSeller: boolean;
  chefSpecial: boolean;
  pairings: string[];
};

export function compactWaiterMenu(dishes: Dish[]): WaiterMenuDish[] {
  const names = dishes.map((dish) => dish.name);
  return dishes
    .filter((dish) => !isExtraCategory(dish.category))
    .map((dish) => {
      const veg = isVegDish(dish);
      const pairings: string[] = [];
      if (/burger|roll|main/i.test(dish.category + dish.name)) {
        const fries = names.find((name) => /fries/i.test(name));
        const drink = names.find((name) => /coffee|mocktail|shake/i.test(name));
        if (fries) pairings.push(fries);
        if (drink) pairings.push(drink);
      } else if (/coffee|beverage/i.test(dish.category)) {
        const snack = names.find((name) => /fries|roll|burger/i.test(name));
        if (snack) pairings.push(snack);
      }
      return {
        id: String(dish.id),
        posId: dish.posMenuItemId ?? (typeof dish.id === "number" ? dish.id : null),
        name: dish.name,
        price: Number(dish.price) || 0,
        category: dish.category,
        description: String(dish.description || "").slice(0, 140),
        prepMinutes: prepMinutes(dish),
        veg,
        vegan: vegan(dish),
        jain: jainFriendly(dish),
        spice: spiceLevel(dish),
        kids: kidsFriendly(dish),
        available: !dish.outOfStock,
        bestSeller: isBestSeller(dish),
        chefSpecial: Boolean(dish.popular),
        pairings: pairings.slice(0, 2),
      };
    });
}
