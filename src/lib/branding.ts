import { menuData } from "@/data/menuData";

export const CAFE_NAME = "Adda";
export const CAFE_TAGLINE = "Where Every Bite Tells a Story";

export const ORDER_OPTIONS = [
  ...menuData
    .filter((dish) => dish.category !== "Topping")
    .map((dish) => dish.name),
  "Other",
] as const;

export const SERVICE_OPTIONS = ["Friendly", "Quick", "Excellent", "Average"] as const;

export const RECOMMEND_OPTIONS = [
  { value: "Loved it", label: "Loved it", emoji: "😍" },
  { value: "Yes", label: "Yes", emoji: "😊" },
  { value: "It was okay", label: "It was okay", emoji: "😐" },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "mr", label: "Marathi" },
] as const;

export type LanguageCode = (typeof LANGUAGE_OPTIONS)[number]["value"];
