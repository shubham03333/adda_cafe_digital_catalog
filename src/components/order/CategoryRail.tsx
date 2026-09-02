"use client";

import type { CategoryRailItem } from "@/lib/order-display";
import { cn } from "@/lib/utils";

type CategoryRailProps = {
  items: CategoryRailItem[];
  selected: string;
  onSelect: (name: string) => void;
};

export function CategoryRail({ items, selected, onSelect }: CategoryRailProps) {
  return (
    <nav className="flex h-full min-h-0 w-[76px] shrink-0 flex-col gap-1 self-stretch overflow-y-auto overscroll-contain bg-[#F3F3F3] hide-scrollbar">
      {items.map((item) => {
        const active = selected === item.name;
        return (
          <button
            key={item.name}
            type="button"
            onClick={() => onSelect(item.name)}
            className={cn(
              "relative flex flex-col items-center rounded-2xl px-1 py-2 text-center transition",
              active ? "bg-white shadow-sm" : "bg-transparent"
            )}
          >
            {active ? <span className="absolute left-0 top-3 h-8 w-1 rounded-full bg-[#F5B400]" /> : null}
            <img src={item.image} alt="" className="h-10 w-10 rounded-xl object-cover" />
            <span className="mt-1 line-clamp-2 text-[10px] font-bold leading-tight text-gray-900">{item.name}</span>
            <span className="text-[10px] text-gray-400">{item.count}</span>
          </button>
        );
      })}
    </nav>
  );
}
