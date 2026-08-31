"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { menuData, type Dish } from "@/data/menuData";
import { cn } from "@/lib/utils";

const GROUP_ORDER = ["Main Course", "Burger", "Beverage", "Combo", "Platters", "Fries"];

type OrderPickerProps = {
  selected: string[];
  onChange: (items: string[]) => void;
  dishes?: Dish[];
};

export function OrderPicker({ selected, onChange, dishes = menuData }: OrderPickerProps) {
  const groups = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const dish of dishes) {
      if (dish.category === "Topping") continue;
      const list = map.get(dish.category) ?? [];
      list.push(dish.name);
      map.set(dish.category, list);
    }
    const ordered = GROUP_ORDER.filter((name) => map.has(name)).map((name) => ({
      name,
      items: map.get(name) ?? [],
    }));
    const rest = [...map.keys()]
      .filter((name) => !GROUP_ORDER.includes(name))
      .map((name) => ({ name, items: map.get(name) ?? [] }));
    return [...ordered, ...rest, { name: "Other", items: ["Other"] }];
  }, [dishes]);

  const [open, setOpen] = useState<string | null>(groups[0]?.name ?? null);

  function toggleItem(name: string) {
    const next = selected.includes(name)
      ? selected.filter((item) => item !== name)
      : [...selected, name];
    onChange(next);
    setOpen(null);
  }

  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
        What did you order?
      </legend>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2 pb-2">
          {selected.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onChange(selected.filter((value) => value !== item))}
              className="min-h-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 text-xs font-semibold text-black"
            >
              {item} ×
            </button>
          ))}
        </div>
      ) : null}
      {groups.map((group) => {
        const isOpen = open === group.name;
        return (
          <div key={group.name} className="rounded-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : group.name)}
              className="flex min-h-12 w-full items-center justify-between px-4 text-sm font-semibold text-gray-800 dark:text-gray-100"
            >
              {group.name}
              <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen ? (
              <div className="flex flex-wrap gap-2 px-3 pb-3">
                {group.items.map((item) => {
                  const active = selected.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleItem(item)}
                      className={cn(
                        "min-h-11 rounded-2xl border px-3 text-left text-xs font-medium",
                        active
                          ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black border-amber-300"
                          : "bg-gray-50 border-gray-200 text-gray-800 dark:bg-zinc-800 dark:text-gray-100 dark:border-zinc-600"
                      )}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </fieldset>
  );
}
