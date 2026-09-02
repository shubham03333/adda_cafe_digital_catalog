"use client";

import { useState } from "react";
import type { Dish } from "@/data/menuData";
import { isBestSeller, isVegDish, prepMinutes } from "@/lib/order-display";
import { VegMark } from "@/components/order/VegMark";
import { cn } from "@/lib/utils";

type MenuItemCardProps = {
  dish: Dish;
  quantity: number;
  canOrder: boolean;
  onAdd: () => void;
  onOpen: () => void;
};

export function MenuItemCard({ dish, quantity, canOrder, onAdd, onOpen }: MenuItemCardProps) {
  const [loaded, setLoaded] = useState(false);
  const veg = isVegDish(dish);
  const mins = prepMinutes(dish);

  return (
    <article className="rounded-[20px] bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition active:scale-[0.99]">
      <button type="button" className="flex w-full gap-3 text-left" onClick={onOpen}>
        <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-2xl bg-gray-100">
          {!loaded ? <div className="absolute inset-0 animate-pulse bg-gray-100" /> : null}
          <img
            src={dish.image || "/adda.png"}
            alt=""
            className={cn("h-full w-full object-cover", loaded ? "opacity-100" : "opacity-0")}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
          />
          {dish.popular ? (
            <span className="absolute left-1 top-1 rounded-full bg-[#F5B400] px-1.5 py-0.5 text-[9px] font-black text-gray-900">
              Popular
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5">
            <VegMark veg={veg} className="mt-0.5" />
            <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900">{dish.name}</h3>
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-gray-500">{dish.description || `${mins} min prep`}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {isBestSeller(dish) ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">Best seller</span>
            ) : null}
            <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">{mins} min</span>
            {canOrder ? (
              <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">Customisable</span>
            ) : null}
          </div>
        </div>
      </button>
      <div className="mt-2 flex items-center justify-between pl-[100px]">
        <p className="text-base font-black text-gray-900">₹{dish.price}</p>
        {canOrder ? (
          <button
            type="button"
            onClick={onAdd}
            className="min-h-10 rounded-full bg-[#F5B400] px-4 text-sm font-black text-gray-900 shadow-sm active:scale-95"
          >
            {quantity > 0 ? `Add · ${quantity}` : "Add"}
          </button>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Ask staff</span>
        )}
      </div>
    </article>
  );
}

export function MenuSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-[20px] bg-white p-3">
          <div className="h-[88px] w-[88px] animate-pulse rounded-2xl bg-gray-100" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-lg font-black text-gray-900">{title}</p>
      <p className="mt-2 text-sm text-gray-500">{body}</p>
    </div>
  );
}
